defmodule OperatelyEmail.Emails.TaskMovingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.Tasks.Task
  alias OperatelyWeb.Paths

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, task} =
      Task.get(:system, id: activity.content["task_id"], opts: [preload: [:project, :space]])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: destination_name(task), who: author, action: "moved the task \"#{task.name}\"")
    |> assign(:author, author)
    |> assign(:task_name, task.name)
    |> assign(:destination_name, destination_name(task))
    |> assign(:cta_url, Paths.task_path(company, task) |> Paths.to_url())
    |> render("task_moving")
  end

  defp destination_name(task) do
    case Task.task_type(task) do
      "space" -> task.space.name
      "project" -> task.project.name
    end
  end
end
