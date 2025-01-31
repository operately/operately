defmodule Operately.Assignments.FilterLateAssignments do
  alias Operately.Goals.Goal
  alias Operately.Projects.Project

  def filter(assignments, reports, person) do
    Enum.filter(assignments, fn assignment ->
      case assignment do
        %Project{} -> late_project(assignment, reports, person)
        %Goal{} -> late_goal(assignment, reports, person)
      end
    end)
  end

  defp late_project(project, reports, person) do
    days_late = business_days_between(project.next_check_in_scheduled_at, Date.utc_today())

    if is_reviewer?(project, person) do
      days_late >= 3
    else
      project
      |> find_manager_level(reports)
      |> is_late?(days_late)
    end
  end

  defp late_goal(goal, reports, person) do
    days_late = business_days_between(goal.next_update_scheduled_at, Date.utc_today())

    if is_reviewer?(goal, person) do
      days_late >= 3
    else
      goal
      |> find_manager_level(reports)
      |> is_late?(days_late)
    end
  end

  defp business_days_between(from, to) do
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

  defp find_manager_level(resource, reports) do
    Enum.find_value(reports, fn {person_id, level} ->
      if is_champion?(resource, person_id), do: level
    end)
  end

  defp is_late?(_manager_level = 0, days_late), do: days_late >= 5
  defp is_late?(_manager_level = 1, days_late), do: days_late >= 10
  defp is_late?(_manager_level, days_late), do: days_late >= 15

  defp is_reviewer?(resource = %Project{}, person), do: resource.reviewer.id == person.id
  defp is_reviewer?(resource = %Goal{}, person), do: resource.reviewer_id == person.id

  defp is_champion?(resource = %Project{}, person_id), do: resource.champion.id == person_id
  defp is_champion?(resource = %Goal{}, person_id), do: resource.champion_id == person_id
end
