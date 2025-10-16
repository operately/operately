defmodule OperatelyEmail.Emails.TaskDueDateUpdatingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.Tasks.Task

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, task} =
      Task.get(:system,
        id: activity.content["task_id"],
        opts: [
          preload: [:project]
        ]
      )

    previous_date = get_date_value(activity.content["old_due_date"])
    new_date = get_date_value(activity.content["new_due_date"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: task.project.name, who: author, action: "changed the due date for \"#{task.name}\"")
    |> assign(:author, author)
    |> assign(:name, task.name)
    |> assign(:previous_date, previous_date)
    |> assign(:new_date, new_date)
    |> assign(:cta_url, Paths.project_task_path(company, task) |> Paths.to_url())
    |> render("task_due_date_updating")
  end

  defp get_date_value(nil), do: nil
  defp get_date_value(date), do: date.value
end
