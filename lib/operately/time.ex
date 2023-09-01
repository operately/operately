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

    NaiveDateTime.new!(date, ~T[09:00:00])
  end

end
