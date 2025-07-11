export type DateType = 'exact' | 'month' | 'quarter' | 'semester' | 'year';

export interface DateTypeOption {
  value: DateType;
  label: string;
}

export interface MonthOption {
  value: number;
  label: string;
  name: string;
}

export interface PeriodOption {
  value: number;
  label: string;
  range: string;
}

export interface DatePickerProps {
  onDateSelect?: (date: string) => void;
  onCancel?: () => void;
  initialDateType?: DateType;
  initialSelectedDate?: string;
  initialSelectedYear?: number;
  initialSelectedPeriod?: number;
}
