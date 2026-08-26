defmodule Operately.Assignments.KpiSchedule do
  @moduledoc """
  Defines the reporting period in which a KPI champion must log an update.

  Weekly periods follow ISO weeks (Monday through Sunday). Monthly periods
  follow calendar months. The first day of the period is the assignment's due
  date, so an unlogged update remains visible and overdue until it is recorded.
  """

  def current_period(cadence, today \\ Date.utc_today())

  def current_period(:weekly, today) do
    period_start = Date.add(today, 1 - Date.day_of_week(today))
    {period_start, Date.add(period_start, 6)}
  end

  def current_period(:monthly, today) do
    period_start = Date.beginning_of_month(today)
    {period_start, Date.end_of_month(today)}
  end
end
