defmodule Operately.Assignments.FilterLateAssignments do
  alias Operately.Assignments.Reviewable
  alias Operately.Goals.{Goal, Update}
  alias Operately.Projects.{CheckIn, Project}

  def filter(assignments, reports, person) do
    Enum.filter(assignments, fn assignment ->
      case assignment do
        %Project{} -> late_goal_or_project?(assignment, reports, person)
        %Goal{} -> late_goal_or_project?(assignment, reports, person)
        %CheckIn{} -> late_check_in_or_update?(assignment, reports)
        %Update{} -> late_check_in_or_update?(assignment, reports)
      end
    end)
  end

  defp late_goal_or_project?(assignment, reports, person) do
    due_date = Reviewable.due_date(assignment)
    days_late = business_days_between(due_date, Date.utc_today())

    if Reviewable.is_reviewer?(assignment, person) do
      days_late >= 3
    else
      assignment
      |> get_manager_depth(reports)
      |> is_late?(days_late)
    end
  end

  defp late_check_in_or_update?(assignment, reports) do
    due_date = Reviewable.due_date(assignment)
    days_late = business_days_between(due_date, Date.utc_today())

    assignment
    |> get_manager_depth(reports)
    |> is_late?(days_late)
  end

  def business_days_between(from, to) do
    if Date.before?(from, to) do
      count_business_days(from, to, 0)
    else
      0
    end
  end

  defp count_business_days(date, to, count) do
    if Date.before?(date, to) do
      next_date = Date.add(date, 1)

      if Date.day_of_week(next_date) in [6, 7] do
        count_business_days(next_date, to, count)
      else
        count_business_days(next_date, to, count + 1)
      end
    else
      count
    end
  end

  defp get_manager_depth(resource, reports) do
    Enum.find_value(reports, fn {person, depth} ->
      if Reviewable.is_reviewer?(resource, person), do: depth
    end)
  end

  defp is_late?(_manager_depth = 0, days_late), do: days_late >= 5
  defp is_late?(_manager_depth = 1, days_late), do: days_late >= 10
  defp is_late?(_manager_depth, days_late), do: days_late >= 15
end
