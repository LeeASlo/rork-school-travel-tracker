import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { DayEntry, WeeklySummary, DailyBreakdown, MonthlySummary, WeeklyBreakdown } from '@/types/work';
import { useSettings } from '@/contexts/SettingsContext';

const STORAGE_KEY = 'work_tracking_entries';
const TIMESHEET_PHOTOS_KEY = 'timesheet_photos';

interface TimesheetPhotos {
  [weekKey: string]: string;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return end;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const [WorkTrackingProvider, useWorkTracking] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const [selectedWeek, setSelectedWeek] = useState<Date>(getWeekStart(new Date()));
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const entriesQuery = useQuery({
    queryKey: ['work-entries'],
    queryFn: async (): Promise<DayEntry[]> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored || stored === 'undefined' || stored === 'null') {
          return [];
        }
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error loading work entries:', error);
        return [];
      }
    },
  });

  const timesheetPhotosQuery = useQuery({
    queryKey: ['timesheet-photos'],
    queryFn: async (): Promise<TimesheetPhotos> => {
      try {
        const stored = await AsyncStorage.getItem(TIMESHEET_PHOTOS_KEY);
        if (!stored || stored === 'undefined' || stored === 'null') {
          return {};
        }
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error loading timesheet photos:', error);
        return {};
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (entries: DayEntry[]) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      return entries;
    },
    onSuccess: (entries) => {
      queryClient.setQueryData(['work-entries'], entries);
    },
  });

  const saveTimesheetPhotoMutation = useMutation({
    mutationFn: async ({ weekKey, photoUri }: { weekKey: string; photoUri?: string }) => {
      const currentPhotos = timesheetPhotosQuery.data || {};
      const updatedPhotos = { ...currentPhotos };
      if (photoUri) {
        updatedPhotos[weekKey] = photoUri;
      } else {
        delete updatedPhotos[weekKey];
      }
      await AsyncStorage.setItem(TIMESHEET_PHOTOS_KEY, JSON.stringify(updatedPhotos));
      return updatedPhotos;
    },
    onSuccess: (photos) => {
      queryClient.setQueryData(['timesheet-photos'], photos);
    },
  });

  const { mutate: mutateSave } = saveMutation;
  const { mutate: mutateTimesheetPhoto } = saveTimesheetPhotoMutation;

  const entries = useMemo(() => entriesQuery.data || [], [entriesQuery.data]);
  const timesheetPhotos = useMemo(() => timesheetPhotosQuery.data || {}, [timesheetPhotosQuery.data]);

  const addOrUpdateEntry = useCallback((entry: DayEntry) => {
    const existingIndex = entries.findIndex((e) => e.date === entry.date);
    const updatedEntries =
      existingIndex >= 0
        ? entries.map((e, i) => (i === existingIndex ? entry : e))
        : [...entries, entry];
    mutateSave(updatedEntries);
  }, [entries, mutateSave]);

  const deleteEntry = useCallback((date: string) => {
    const updatedEntries = entries.filter((e) => e.date !== date);
    mutateSave(updatedEntries);
  }, [entries, mutateSave]);

  const getWeeklySummary = useCallback((weekStart: Date): WeeklySummary => {
    const weekEnd = getWeekEnd(weekStart);
    const weekStartStr = formatDate(weekStart);
    const weekEndStr = formatDate(weekEnd);

    const weekEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });

    const dailyBreakdown: DailyBreakdown[] = weekEntries.map((entry) => {
      const totalMiles = entry.endMileage - entry.startMileage;
      const businessMiles = Math.max(0, totalMiles - (entry.personalMiles || 0));
      return {
        date: entry.date,
        schools: entry.schools.map((s) => s.name),
        hours: entry.hoursWorked,
        miles: businessMiles,
        additionalExpenses: entry.additionalExpenses || 0,
        isRebooking: entry.isRebooking,
      };
    });

    const totalHours = dailyBreakdown.reduce((sum, day) => sum + day.hours, 0);
    const totalMiles = dailyBreakdown.reduce((sum, day) => sum + day.miles, 0);
    const totalAdditionalExpenses = dailyBreakdown.reduce((sum, day) => sum + day.additionalExpenses, 0);
    const mileageExpense = totalMiles * settings.mileageRate;

    const weekKey = weekStartStr;
    const timesheetPhotoUri = timesheetPhotos[weekKey];

    return {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      totalHours,
      totalMiles,
      dailyBreakdown,
      mileageExpense,
      additionalExpenses: totalAdditionalExpenses,
      timesheetPhotoUri,
    };
  }, [entries, settings.mileageRate, timesheetPhotos]);

  const currentWeekSummary = useMemo(
    () => getWeeklySummary(selectedWeek),
    [selectedWeek, getWeeklySummary]
  );

  const getEntryForDate = useCallback((date: string): DayEntry | undefined => {
    return entries.find((e) => e.date === date);
  }, [entries]);

  const goToPreviousWeek = useCallback(() => {
    const prev = new Date(selectedWeek);
    prev.setDate(prev.getDate() - 7);
    setSelectedWeek(prev);
  }, [selectedWeek]);

  const goToNextWeek = useCallback(() => {
    const next = new Date(selectedWeek);
    next.setDate(next.getDate() + 7);
    setSelectedWeek(next);
  }, [selectedWeek]);

  const goToCurrentWeek = useCallback(() => {
    setSelectedWeek(getWeekStart(new Date()));
  }, []);

  const getMonthlySummary = useCallback((month: Date): MonthlySummary => {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const monthStartStr = formatDate(monthStart);
    const monthEndStr = formatDate(monthEnd);

    const monthEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= monthStart && entryDate <= monthEnd;
    });

    const totalHours = monthEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
    const totalMiles = monthEntries.reduce((sum, entry) => {
      const totalMiles = entry.endMileage - entry.startMileage;
      const businessMiles = Math.max(0, totalMiles - (entry.personalMiles || 0));
      return sum + businessMiles;
    }, 0);
    const totalAdditionalExpenses = monthEntries.reduce((sum, entry) => sum + (entry.additionalExpenses || 0), 0);
    const rebookingsCount = monthEntries.filter((entry) => entry.isRebooking).length;
    const mileageExpense = totalMiles * settings.mileageRate;

    const holidayYearStart = new Date(settings.holidayYearStart);
    const holidayYearEnd = new Date(holidayYearStart);
    holidayYearEnd.setFullYear(holidayYearEnd.getFullYear() + 1);

    const yearEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= holidayYearStart && entryDate < holidayYearEnd;
    });

    const holidaysUsedHours = yearEntries
      .filter((entry) => entry.isDayOff)
      .reduce((sum, entry) => sum + entry.hoursWorked, 0);
    const holidaysUsed = holidaysUsedHours / 7.2;

    const contractedHoursPerWeek = settings.contractedHoursPerWeek;
    const weeksInMonth = (monthEnd.getTime() - monthStart.getTime()) / (7 * 24 * 60 * 60 * 1000);
    const contractedHoursForMonth = contractedHoursPerWeek * weeksInMonth;
    const overtimeHours = Math.max(0, totalHours - contractedHoursForMonth);

    const overtimeHolidayDays = overtimeHours / 7.2;
    const totalHolidayEntitlement = settings.totalAnnualHolidayDays + overtimeHolidayDays;
    const holidaysRemaining = totalHolidayEntitlement - holidaysUsed;

    const weeklyBreakdown: WeeklyBreakdown[] = [];
    let currentWeek = getWeekStart(monthStart);

    while (currentWeek <= monthEnd) {
      const weekEnd = getWeekEnd(currentWeek);
      const weekEntries = entries.filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= currentWeek && entryDate <= weekEnd && entryDate >= monthStart && entryDate <= monthEnd;
      });

      if (weekEntries.length > 0 || (currentWeek >= monthStart && currentWeek <= monthEnd)) {
        const hours = weekEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
        const miles = weekEntries.reduce((sum, entry) => {
          const totalMiles = entry.endMileage - entry.startMileage;
          const businessMiles = Math.max(0, totalMiles - (entry.personalMiles || 0));
          return sum + businessMiles;
        }, 0);
        const additionalExpenses = weekEntries.reduce((sum, entry) => sum + (entry.additionalExpenses || 0), 0);
        const rebookings = weekEntries.filter((entry) => entry.isRebooking).length;

        weeklyBreakdown.push({
          weekStart: formatDate(currentWeek),
          weekEnd: formatDate(weekEnd),
          hours,
          miles,
          additionalExpenses,
          rebookings,
        });
      }

      currentWeek = new Date(currentWeek);
      currentWeek.setDate(currentWeek.getDate() + 7);
    }

    return {
      monthStart: monthStartStr,
      monthEnd: monthEndStr,
      totalHours,
      totalMiles,
      rebookingsCount,
      weeklyBreakdown,
      mileageExpense,
      additionalExpenses: totalAdditionalExpenses,
      overtimeHours,
      holidaysUsed,
      holidaysRemaining,
      totalHolidayEntitlement,
    };
  }, [entries, settings]);

  const currentMonthSummary = useMemo(
    () => getMonthlySummary(selectedMonth),
    [selectedMonth, getMonthlySummary]
  );

  const goToPreviousMonth = useCallback(() => {
    const prev = new Date(selectedMonth);
    prev.setMonth(prev.getMonth() - 1);
    setSelectedMonth(prev);
  }, [selectedMonth]);

  const goToNextMonth = useCallback(() => {
    const next = new Date(selectedMonth);
    next.setMonth(next.getMonth() + 1);
    setSelectedMonth(next);
  }, [selectedMonth]);

  const goToCurrentMonth = useCallback(() => {
    const now = new Date();
    setSelectedMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  }, []);

  const updateTimesheetPhoto = useCallback((weekStart: Date, photoUri?: string) => {
    const weekKey = formatDate(weekStart);
    mutateTimesheetPhoto({ weekKey, photoUri });
  }, [mutateTimesheetPhoto]);

  return useMemo(() => ({
    entries,
    addOrUpdateEntry,
    deleteEntry,
    getEntryForDate,
    currentWeekSummary,
    selectedWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    currentMonthSummary,
    selectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    updateTimesheetPhoto,
    isLoading: entriesQuery.isLoading,
    isSaving: saveMutation.isPending,
  }), [
    entries,
    addOrUpdateEntry,
    deleteEntry,
    getEntryForDate,
    currentWeekSummary,
    selectedWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    currentMonthSummary,
    selectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    updateTimesheetPhoto,
    entriesQuery.isLoading,
    saveMutation.isPending,
  ]);
});
