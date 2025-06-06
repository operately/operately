defmodule Operately.Time do
  def utc_datetime_now() do
    DateTime.truncate(DateTime.utc_now(), :second)
  end

  @doc """
  Create a NaiveDateTime for a specific day in the current month.
  e.g. Time.day_in_current_month(15) will return a NaiveDateTime
  for the 15th of the current month.
  """
  def day_in_current_month(day) do
    NaiveDateTime.from_erl!({
      {Date.utc_today().year, Date.utc_today().month, day},
      {0, 0, 0}
    })
  end

  def days_ago(n) do
    DateTime.utc_now() |> DateTime.add(-n, :day) |> DateTime.truncate(:second)
  end

  def days_from_now(n) do
    DateTime.utc_now() |> DateTime.add(n, :day) |> DateTime.truncate(:second)
  end

  def short_date(date) do
    month = Calendar.strftime(date, "%B")
    day = Calendar.strftime(date, "%-d")

    "#{month} #{day}"
  end

  def first_friday_from_today do
    today = Date.utc_today()

    date =
      cond do
        Date.day_of_week(today) == 5 ->
          Date.add(today, 7)

        Date.day_of_week(today) < 5 ->
          Date.add(today, 5 - Date.day_of_week(today))

        true ->
          Date.add(today, 12 - Date.day_of_week(today))
      end

    as_datetime(date)
  end

  # how many days before the due date is considered on time
  @montly_delta 7

  def calculate_next_monthly_check_in(due, check_in_date) do
    due = as_date(due || check_in_date)
    check_in_date = as_date(check_in_date)

    case Date.compare(check_in_date, due) do
      :eq ->
        # check in on time, schedule next check-in for first of next month
        first_of_next_month(check_in_date)

      :gt ->
        # check-in late, schedule first of next month
        first_of_next_month(check_in_date)

      :lt ->
        # check-in early
        diff = Date.diff(due, check_in_date)

        if diff <= @montly_delta do
          # check-in always on time just a day before the due date
          # we consider this as on time
          first_of_next_month(due)
        else
          # significantly early, don't change the next check-in
          as_datetime(due)
        end
    end
  end

  # how many days before the due date is considered on time
  @weekly_delta 1

  def calculate_next_weekly_check_in(due, check_in_date) do
    due = as_date(due || check_in_date)
    check_in_date = as_date(check_in_date)

    case Date.compare(check_in_date, due) do
      :eq ->
        # check in on time, schedule next check-in for next Friday
        next_week_friday(check_in_date)

      :gt ->
        # check-in late, schedule next friday from today
        next_week_friday(check_in_date)

      :lt ->
        # check-in early
        diff = Date.diff(due, check_in_date)

        if diff <= @weekly_delta do
          # check-in always on time just a day before the due date
          # we consider this as on time
          next_week_friday(due)
        else
          # significantly early, don't change the next check-in
          as_datetime(due)
        end
    end
  end

  def first_of_next_month(date) do
    {year, month, _} = Date.to_erl(date)

    if month == 12 do
      as_datetime(Date.from_erl!({year + 1, 1, 1}))
    else
      as_datetime(Date.from_erl!({year, month + 1, 1}))
    end
  end

  defp next_week_friday(date) do
    day = Date.day_of_week(date)

    result =
      cond do
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
  def as_date(%NaiveDateTime{} = date), do: NaiveDateTime.to_date(date)

  def as_datetime(%DateTime{} = date), do: date
  def as_datetime(%Date{} = date), do: DateTime.new!(date, ~T[00:00:00], "Etc/UTC")
  def as_datetime(%NaiveDateTime{} = date), do: DateTime.from_naive!(date, "Etc/UTC")

  def current_month do
    Date.utc_today() |> Calendar.strftime("%B")
  end

  def current_day do
    Date.utc_today().day
  end

  def relative_due_days(due) do
    today = DateTime.utc_now() |> DateTime.to_date()
    due = as_datetime(due)

    case Date.compare(due, today) do
      :lt ->
        days_ago = Date.diff(today, due)

        "was due #{days_ago} days ago"

      :eq ->
        "is due today"
    end
  end
end
