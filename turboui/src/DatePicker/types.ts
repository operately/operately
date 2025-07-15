type DateType = "exact" | "month" | "quarter" | "year";

export interface SelectedDate {
  date?: Date;
  type?: DateType;
}

export interface DateTypeOption {
  value: DateType;
  label: string;
}

export interface MonthOption {
  value: string;
  label: string;
  name: string;
}

export interface PeriodOption {
  value: string;
  label: string;
}

export interface DatePickerProps {
  onDateSelect?: (date: string) => void;
  onCancel?: () => void;
  initialDateType?: DateType;
  initialSelectedDate?: string;
  initialSelectedYear?: number;
  initialSelectedPeriod?: string;
}
