defmodule OperatelyEmail.Email do
  alias Operately.{People, Projects}
  alias Operately.Repo

  def assignments_email(person) do
    import Bamboo.Email

    company = Repo.preload(person, [:company]).company
    account = Repo.preload(person, [:account]).account

    assignment_groups = assignments(person)

    if Enum.empty?(assignment_groups) do
      :no_assignments
    else
      assigns = %{
        company: company,
        assignment_groups: assignment_groups
      }

      {:ok, new_email(
        to: account.email,
        from: {org_name(company), from_email()},
        subject: "#{org_name(company)}: Your assignments for today",
        html_body: OperatelyEmail.Views.Assignments.html(assigns),
        text_body: OperatelyEmail.Views.Assignments.text(assigns)
      )}
    end
  end

  defp from_email do
    Application.get_env(:operately, :notification_email)
  end

  defp org_name(company) do
    "Operately (#{company.name})"
  end

  def assignments(person) do
    import Ecto.Query
    alias Operately.Repo
    alias Operately.Projects.Project
    alias Operately.Projects.Milestone

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
    if project.next_update_scheduled_at < DateTime.utc_now() do
      [
        %{
          type: :status_update,
          due: relative_due(project.next_update_scheduled_at),
          url: project_status_update_url(project),
          name: "Status Update"
        }
      ]
    else
      []
    end
  end

  defp milestones(project) do
    project.milestones
    |> Enum.filter(fn m -> milestone_due?(m) end)
    |> Enum.map(fn milestone ->
      %{
        type: :milestone,
        due: relative_due(milestone.deadline_at),
        url: project_milestone_url(project),
        name: milestone.title
      }
    end)
  end

  defp project_status_update_url(project) do
    OperatelyWeb.Endpoint.url() <> "/projects/#{project.id}/updates/new?messageType=status_update"
  end

  defp project_milestone_url(project) do
    OperatelyWeb.Endpoint.url() <> "/projects/#{project.id}"
  end

  defp milestone_due?(milestone) do
    today = DateTime.utc_now() |> DateTime.to_date()
    due = normalize_date(milestone.deadline_at)

    Date.compare(due, today) in [:lt, :eq]
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
