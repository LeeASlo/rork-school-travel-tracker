export interface DayEntry {
  id: string;
  date: string;
  schools: School[];
  startTime: string;
  endTime: string;
  hoursWorked: number;
  startLocation: string;
  endLocation: string;
  startMileage: number;
  endMileage: number;
  personalMiles: number;
  additionalExpenses: number;
  isRebooking: boolean;
  isDayOff: boolean;
  isWorkingInLab: boolean;
  hasDeliveries: boolean;
  comments?: string;
}

export interface School {
  id: string;
  name: string;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  totalMiles: number;
  dailyBreakdown: DailyBreakdown[];
  mileageExpense: number;
  additionalExpenses: number;
  timesheetPhotoUri?: string;
}

export interface DailyBreakdown {
  date: string;
  schools: string[];
  hours: number;
  miles: number;
  additionalExpenses: number;
  isRebooking: boolean;
}

export interface MonthlySummary {
  monthStart: string;
  monthEnd: string;
  totalHours: number;
  totalMiles: number;
  rebookingsCount: number;
  weeklyBreakdown: WeeklyBreakdown[];
  mileageExpense: number;
  additionalExpenses: number;
  overtimeHours: number;
  holidaysUsed: number;
  holidaysRemaining: number;
  totalHolidayEntitlement: number;
}

export interface WeeklyBreakdown {
  weekStart: string;
  weekEnd: string;
  hours: number;
  miles: number;
  additionalExpenses: number;
  rebookings: number;
}
