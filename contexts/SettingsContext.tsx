import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';

const SETTINGS_STORAGE_KEY = 'app_settings';

export interface AppSettings {
  mileageRate: number;
  contractedHoursPerWeek: number;
  contractedHoursPerDay: number;
  holidayYearStart: Date;
  totalAnnualHolidayDays: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  mileageRate: 0.14,
  contractedHoursPerWeek: 40,
  contractedHoursPerDay: 7.2,
  holidayYearStart: new Date(new Date().getFullYear(), 3, 1),
  totalAnnualHolidayDays: 28,
};

export const [SettingsProvider, useSettings] = createContextHook(() => {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['app-settings'],
    queryFn: async (): Promise<AppSettings> => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!stored || stored === 'undefined' || stored === 'null') {
          return DEFAULT_SETTINGS;
        }
        
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          holidayYearStart: new Date(parsed.holidayYearStart),
        };
      } catch (error) {
        console.error('Error loading settings:', error);
        return DEFAULT_SETTINGS;
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (settings: AppSettings) => {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      return settings;
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(['app-settings'], settings);
    },
  });

  const { mutate: mutateSave } = saveMutation;

  const settings = useMemo(() => settingsQuery.data || DEFAULT_SETTINGS, [settingsQuery.data]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    mutateSave(updated);
  }, [settings, mutateSave]);

  return useMemo(() => ({
    settings,
    updateSettings,
    isLoading: settingsQuery.isLoading,
    isSaving: saveMutation.isPending,
  }), [settings, updateSettings, settingsQuery.isLoading, saveMutation.isPending]);
});
