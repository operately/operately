defmodule Operately.Assignments.FilterLateAssignments do
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
    days_late = find_days_late(assignment)

    if is_reviewer?(assignment, person) do
      days_late >= 3
    else
      assignment
      |> find_manager_depth(reports)
      |> is_late?(days_late)
    end
  end

  defp late_check_in_or_update?(assignment, reports) do
    days_late = find_days_late(assignment)

    assignment
    |> find_manager_depth(reports)
    |> is_late?(days_late)
  end

  defp find_days_late(%Project{} = project), do: business_days_between(project.next_check_in_scheduled_at, Date.utc_today())
  defp find_days_late(%Goal{} = goal), do: business_days_between(goal.next_update_scheduled_at, Date.utc_today())
  defp find_days_late(%CheckIn{} = check_in), do: business_days_between(check_in.inserted_at, Date.utc_today())
  defp find_days_late(%Update{} = update), do: business_days_between(update.inserted_at, Date.utc_today())

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

  defp find_manager_depth(resource, reports) do
    Enum.find_value(reports, fn {%{id: id}, depth} ->
      if is_resposible_for_resource?(resource, id), do: depth
    end)
  end

  defp is_resposible_for_resource?(resource = %Project{}, person_id), do: resource.reviewer.id == person_id
  defp is_resposible_for_resource?(resource = %Goal{}, person_id), do: resource.reviewer_id == person_id
  defp is_resposible_for_resource?(resource = %CheckIn{}, person_id), do: resource.project.reviewer.id == person_id
  defp is_resposible_for_resource?(resource = %Update{}, person_id), do: resource.goal.reviewer_id == person_id

  defp is_late?(_manager_depth = 0, days_late), do: days_late >= 5
  defp is_late?(_manager_depth = 1, days_late), do: days_late >= 10
  defp is_late?(_manager_depth, days_late), do: days_late >= 15

  defp is_reviewer?(resource = %Project{}, person), do: resource.reviewer.id == person.id
  defp is_reviewer?(resource = %Goal{}, person), do: resource.reviewer_id == person.id
end
