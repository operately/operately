import React from "react";
import { IconChevronLeft, IconChevronRight } from "../../icons";
import { DatePicker } from "../index";
import classNames from "../../utils/classnames";

interface Props {
  selectedDate?: DatePicker.ContextualDate;
  setSelectedDate: React.Dispatch<React.SetStateAction<DatePicker.ContextualDate | undefined>>;
}

export function InlineCalendar({ selectedDate, setSelectedDate }: Props) {
  const [calendarDate, setCalendarDate] = React.useState(new Date());

  const today = new Date();
  const currentMonth = calendarDate.getMonth();
  const currentYear = calendarDate.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const days: React.ReactNode[] = [];

  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDayWeekday; i++) {
    days.push(<div key={`empty-${i}`} className="w-7 h-7"></div>);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);

    const isSelected = isSelectedDay(day, currentMonth, currentYear, selectedDate);
    const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    const handleDayClick = (day: Date) => {
      const value = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(day);
      setSelectedDate({ date: day, dateType: "day", value });
    };
    const className = classNames(
      "w-7 h-7 text-xs rounded-full transition-colors",
      isSelected && "border border-blue-500 bg-blue-50 text-blue-700",
      isToday && !isSelected && "border border-blue-300 text-blue-600 hover:bg-blue-50",
      !isSelected && !isToday && "hover:bg-gray-100 hover:text-blue-500",
    );

    days.push(
      <button key={day} onClick={() => handleDayClick(date)} className={className}>
        {day}
      </button>,
    );
  }

  const prevMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
          <IconChevronLeft size={16} stroke={1.5} />
        </button>
        <h3 className="font-medium text-sm">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
          <IconChevronRight size={16} stroke={1.5} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="w-7 h-7 text-xs font-medium text-gray-500 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">{days}</div>
    </div>
  );
}

function isSelectedDay(day: number, month: number, year: number, selectedDate?: DatePicker.ContextualDate): boolean {
  return Boolean(
    selectedDate &&
      selectedDate.dateType === "day" &&
      selectedDate.date.getDate() === day &&
      selectedDate.date.getMonth() === month &&
      selectedDate.date.getFullYear() === year,
  );
}
