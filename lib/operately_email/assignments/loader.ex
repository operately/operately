defmodule OperatelyEmail.Assignments.Loader do
  import Ecto.Query
  alias Operately.Repo
  alias Operately.Projects.Project

  def load(person) do
    projects = Repo.all(
      from p in Project,
        join: a in assoc(p, :contributors),
        where: a.person_id == ^person.id and a.role == :champion,
        preload: [:milestones]
    )

    projects |> Enum.map(fn project ->
      %{
        name: project.name,
        assignments: status_updates(project) ++ milestones(project)
      }
    end)
    |> Enum.filter(fn assignment_group -> 
      !Enum.empty?(assignment_group.assignments) 
    end)
  end

  defp status_updates(project) do
    if status_update_due?(project) do
      [
        %{
          type: :status_update,
          due: relative_due(project.next_update_scheduled_at),
          url: OperatelyEmail.project_new_status_update_url(project.id),
          name: "Status Update"
        }
      ]
    else
      []
    end
  end

  defp status_update_due?(project) do
    DateTime.compare(project.next_update_scheduled_at, DateTime.utc_now()) in [:lt, :eq]
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
