import React from "react";
import { IconChevronLeft, IconChevronRight } from "../../icons";
import classNames from "../../utils/classnames";
import * as time from "../../utils/time";
import { DateField } from "../index";

interface Props {
  selectedDate: DateField.ContextualDate | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<DateField.ContextualDate | null>>;
  minDateLimit?: Date;
  maxDateLimit?: Date;
}

export function InlineCalendar({ selectedDate, setSelectedDate, minDateLimit, maxDateLimit }: Props) {
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

    // Check if the date is disabled (outside of min/max range)
    const isDisabled = isDateDisabled(date, minDateLimit, maxDateLimit);

    const handleDayClick = (day: Date) => {
      if (isDisabled) return; // Prevent selection if disabled
      const value = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(day);
      setSelectedDate({ date: day, dateType: "day", value });
    };

    const className = classNames(
      "w-7 h-7 text-xs rounded-full transition-colors",
      isSelected && "border border-blue-500 bg-blue-50 text-blue-700",
      isToday && !isSelected && !isDisabled && "border border-blue-300 text-blue-600 hover:bg-blue-50",
      !isSelected && !isToday && !isDisabled && "hover:bg-gray-100 hover:text-blue-500",
      isDisabled && "opacity-50 cursor-not-allowed line-through text-gray-400",
    );

    days.push(
      <button
        key={day}
        onClick={() => handleDayClick(date)}
        className={className}
        disabled={isDisabled}
        data-test-id={`date-field-day-${day}`}
      >
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
    <div className="bg-white border border-stroke-base rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded" data-testid="date-field-prev-month">
          <IconChevronLeft size={16} stroke={1.5} />
        </button>
        <h3 className="font-medium text-sm" data-testid="date-field-current-month">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded" data-testid="date-field-next-month">
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

function isSelectedDay(
  day: number,
  month: number,
  year: number,
  selectedDate: DateField.ContextualDate | null,
): boolean {
  return Boolean(
    selectedDate &&
      selectedDate.dateType === "day" &&
      selectedDate.date.getDate() === day &&
      selectedDate.date.getMonth() === month &&
      selectedDate.date.getFullYear() === year,
  );
}

function isDateDisabled(date: Date, minDateLimit?: Date, maxDateLimit?: Date): boolean {
  if (minDateLimit && time.compareAsc(date, minDateLimit) < 0) {
    return true;
  }

  if (maxDateLimit && time.compareAsc(date, maxDateLimit) > 0) {
    return true;
  }

  return false;
}
