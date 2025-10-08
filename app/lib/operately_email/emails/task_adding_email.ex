defmodule OperatelyEmail.Emails.TaskAddingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.Tasks.Task

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, task} =
      Task.get(:system,
        id: activity.content["task_id"],
        opts: [preload: [:project]]
      )

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: task.project.name, who: author, action: "added the task \"#{task.name}\"")
    |> assign(:author, author)
    |> assign(:task_name, task.name)
    |> assign(:cta_url, Paths.project_task_path(company, task) |> Paths.to_url())
    |> render("task_adding")
  end
end
