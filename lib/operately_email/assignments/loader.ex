defmodule OperatelyEmail.Assignments.Loader do
  import Ecto.Query
  alias Operately.Repo
  alias Operately.Projects.Project
  alias Operately.Goals.Goal

  def load(person) do
    if person.account_id == nil do
      []
    else
      load_for_person(person)
    end
  end

  defp load_for_person(person) do
    projects = Repo.all(
      from p in Project,
        join: a in assoc(p, :contributors),
        where: a.person_id == ^person.id and a.role == :champion,
        where: p.status == "active",
        preload: [:milestones]
    )

    goals = Repo.all(from g in Goal, where: g.champion_id == ^person.id, where: is_nil(g.closed_at))

    assignment_groups = []

    assignment_groups = assignment_groups ++ Enum.map(projects, fn project ->
      %{
        name: project.name,
        assignments: project_check_ins(project) ++ milestones(project)
      }
    end)

    assignment_groups = assignment_groups ++ Enum.map(goals, fn goal ->
      %{
        name: goal.name,
        assignments: goal_check_ins(goal)
      }
    end)

    assignment_groups
    |> Enum.filter(fn assignment_group -> 
      !Enum.empty?(assignment_group.assignments) 
    end)
  end

  defp project_check_ins(project) do
    if due?(project.next_check_in_scheduled_at) do
      [
        %{
          type: :project_check_in,
          due: relative_due(project.next_check_in_scheduled_at),
          url: OperatelyEmail.project_check_in_new_url(project.id),
          name: "Check-in"
        }
      ]
    else
      []
    end
  end

  defp goal_check_ins(goal) do
    if due?(goal.next_update_scheduled_at) do
      [
        %{
          type: :goal_check_in,
          due: relative_due(goal.next_update_scheduled_at),
          url: OperatelyEmail.goal_new_check_in_url(goal.id),
          name: "Check-in"
        }
      ]
    else
      []
    end
  end

  defp due?(due) do
    DateTime.compare(due, DateTime.utc_now()) in [:lt, :eq]
  end

  defp milestones(project) do
    project.milestones
    |> Enum.filter(&milestone_due?/1)
    |> Enum.filter(&milestone_pending?/1)
    |> Enum.map(fn milestone ->
      %{
        type: :milestone,
        due: relative_due(milestone.deadline_at),
        url: OperatelyEmail.project_milestone_url(project.id, milestone.id),
        name: milestone.title
      }
    end)
  end

  defp milestone_due?(milestone) do
    today = DateTime.utc_now() |> DateTime.to_date()
    due = normalize_date(milestone.deadline_at)

    Date.compare(due, today) in [:lt, :eq]
  end

  defp milestone_pending?(milestone) do
    milestone.status == :pending
  end

  defp relative_due(due) do
    today = DateTime.utc_now() |> DateTime.to_date()
    due = normalize_date(due)

    case Date.compare(due, today) do
      :lt ->
        days_ago = Date.diff(today, due)

        "was due #{days_ago} days ago"
      :eq ->
        "is due today"
    end
  end

  defp normalize_date(date) do
    if date.__struct__ == NaiveDateTime do
      date |> DateTime.from_naive!("Etc/UTC")
    else
      date
    end
    |> DateTime.to_date()
  end
end
