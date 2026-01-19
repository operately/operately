defmodule OperatelyEmail.Emails.ProjectTaskCommentedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias OperatelyWeb.Paths
  alias Operately.{Repo, Updates}
  alias Operately.Tasks.Task

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, task} = Task.get(:system, id: activity.content["task_id"], opts: [
      preload: [:project]
    ])

    comment = Updates.get_comment!(activity.content["comment_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: task.project.name, who: author, action: "commented on: #{task.name}")
    |> assign(:author, author)
    |> assign(:comment, comment)
    |> assign(:name, task.name)
    |> assign(:cta_url, Paths.task_path(company, task, comment) |> Paths.to_url())
    |> render("project_task_commented")
  end
end
