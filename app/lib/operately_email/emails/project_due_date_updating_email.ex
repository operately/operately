defmodule OperatelyEmail.Emails.ProjectDueDateUpdatingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.Projects.Project

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)
    project = Project.get!(:system, id: activity.content["project_id"])

    previous_date = get_date_value(activity.content["old_due_date"])
    new_date = get_date_value(activity.content["new_due_date"])
    action = subject_action(previous_date, new_date)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: action)
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:previous_date, previous_date)
    |> assign(:new_date, new_date)
    |> assign(:cta_url, Paths.project_path(company, project) |> Paths.to_url())
    |> render("project_due_date_updating")
  end

  defp get_date_value(nil), do: nil
  defp get_date_value(%Operately.ContextualDates.ContextualDate{value: value}), do: value
  defp get_date_value(date), do: Calendar.strftime(date, "%b %-d, %Y")

  defp subject_action(_old, nil), do: "removed the due date"
  defp subject_action(nil, _new), do: "set the due date"
  defp subject_action(_old, _new), do: "changed the due date"

  def buffered_item(_person, activity) do
    project = Operately.Projects.get_project!(activity.content["project_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    %{
      parent_id: project.id,
      parent_type: :project,
      parent_name: project.name,
      headline: "updated this project due date",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
