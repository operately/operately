defmodule Operately.Support.Time do
  def next_friday do
    Date.utc_today()
    |> Date.add((5 - Date.day_of_week(Date.utc_today()) + 7) |> rem(7) |> Kernel.+(7))
  end

  # Format the date as "Mon DD" (e.g., "Oct 3", "Nov 15")
  def format_month_day(date) do
    month = Calendar.strftime(date, "%b")
    "#{month} #{date.day}"
  end
end
