import 'react-datepicker';

declare module 'react-datepicker' {
  export interface ReactDatePickerProps {
    renderQuarterContent?: (quarter: number) => React.ReactNode;
    renderYearContent?: (year: number) => React.ReactNode;
  }
}