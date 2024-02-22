defmodule Operately.Time do

  def first_friday_from_today do
    today = Date.utc_today()

    date = cond do
      Date.day_of_week(today) == 5  ->
        Date.add(today, 7)
      Date.day_of_week(today) < 5 ->
        Date.add(today, 5 - Date.day_of_week(today))
      true ->
        Date.add(today, 12 - Date.day_of_week(today))
    end

    as_datetime(date)
  end

  def calculate_next_monthly_check_in(previous_due, check_in_date) do
    previous_due = as_date(previous_due)
    check_in_date = as_date(check_in_date)

    if Date.compare(previous_due, check_in_date) == :lt do
      first_of_next_month(check_in_date)
    else
      if Date.compare(previous_due, Date.add(check_in_date, 7)) == :lt do
        first_of_next_month(previous_due)
      else
        as_datetime(previous_due)
      end
    end
  end

  def calculate_next_check_in(previous_due, check_in_date) do
    if previous_due == nil do
      next_week_friday(check_in_date)
    else
      previous_due = as_date(previous_due)
      check_in_date = as_date(check_in_date)

      if Date.compare(previous_due, check_in_date) == :lt do
        next_week_friday(check_in_date)
      else
        next_week_friday(previous_due)
      end
    end
  end

  defp first_of_next_month(date) do
    {year, month, _} = Date.to_erl(date)

    if month == 12 do
      as_datetime(Date.from_erl!({year + 1, 1, 1}))
    else
      as_datetime(Date.from_erl!({year, month + 1, 1}))
    end
  end

  defp next_week_friday(date) do
    day = Date.day_of_week(date)

    result = cond do
      day == 5 ->
        Date.add(date, 7)
      day < 5 ->
        Date.add(date, 5 - day)
      day > 5 ->
        Date.add(date, 12 - day)
      true ->
        raise "Invalid day of week: #{day}"
    end

    as_datetime(result)
  end

  def as_date(%Date{} = date), do: date
  def as_date(%DateTime{} = date), do: DateTime.to_date(date)
  def as_date(%NaiveDateTime{} = date), do: DateTime.to_date(date)

  def as_datetime(%DateTime{} = date), do: date
  def as_datetime(%Date{} = date), do: DateTime.new!(date, ~T[00:00:00], "Etc/UTC")
  def as_datetime(%NaiveDateTime{} = date), do: DateTime.from_naive!(date, "Etc/UTC")

  def current_month do
    Date.utc_today() |> Calendar.strftime("%B")
  end

  def current_day do
    Date.utc_today().day
  end

end
