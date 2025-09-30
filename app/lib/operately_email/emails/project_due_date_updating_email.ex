defmodule OperatelyEmail.Emails.ProjectDueDateUpdatingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.{Repo, Projects}
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    project = Projects.get_project!(activity.content["project_id"])
    company = Repo.preload(project, :company).company

    old_due_date = activity.content["old_due_date"]
    new_due_date = activity.content["new_due_date"]

    previous_date = get_date_value(old_due_date)
    new_date = get_date_value(new_due_date)
    action = subject_action(old_due_date, new_due_date)
    link = Paths.project_path(company, project) |> Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: action)
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:previous_date, previous_date)
    |> assign(:new_date, new_date)
    |> assign(:cta_url, link)
    |> render("project_due_date_updating")
  end

  defp get_date_value(nil), do: nil
  defp get_date_value(%{value: value}) when is_binary(value), do: value
  defp get_date_value(%{"value" => value}) when is_binary(value), do: value
  defp get_date_value(%Operately.ContextualDates.ContextualDate{value: value}), do: value
  defp get_date_value(%Date{} = date), do: Calendar.strftime(date, "%B %-d, %Y")

  defp get_date_value(%NaiveDateTime{} = date),
    do: date |> NaiveDateTime.to_date() |> get_date_value()

  defp get_date_value(%DateTime{} = date), do: date |> DateTime.to_date() |> get_date_value()

  defp get_date_value(date) when is_binary(date) do
    case Date.from_iso8601(date) do
      {:ok, parsed} -> get_date_value(parsed)
      {:error, _} -> date
    end
  end

  defp get_date_value(date), do: inspect(date)

  defp subject_action(_old, nil), do: "removed the due date"
  defp subject_action(nil, _new), do: "set the due date"
  defp subject_action(_old, _new), do: "changed the due date"
end
