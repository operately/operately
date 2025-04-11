import { useEffect, useState } from 'react';

const ServerSideDatePicker = (props: any) => {
  return (
    <div className="datepicker-placeholder">
      DatePicker loading...
    </div>
  );
};

const DatePickerWrapper = (props: any) => {
  const [DatePickerComponent, setDatePickerComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      import('react-datepicker')
        .then((module) => {
          setDatePickerComponent(() => module.default || module);
          setLoading(false);
        })
        .catch((e) => {
          console.error("Error loading DatePicker:", e);
          setLoading(false);
        });
    }
  }, []);
  
  if (loading || !DatePickerComponent) {
    return <ServerSideDatePicker {...props} />;
  }
  
  return <DatePickerComponent {...props} />;
};

export default DatePickerWrapper;
