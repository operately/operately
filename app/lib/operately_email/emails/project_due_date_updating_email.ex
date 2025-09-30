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
end
