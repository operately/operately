defmodule OperatelyEmail.Emails.SpaceTaskCommentedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias OperatelyWeb.Paths
  alias Operately.{Repo, Updates}
  alias Operately.Tasks.Task

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, task} = Task.get(:system, id: activity.content["task_id"], opts: [
      preload: [:space]
    ])

    comment = Updates.get_comment!(activity.content["comment_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: task.space.name, who: author, action: "commented on: #{task.name}")
    |> assign(:author, author)
    |> assign(:comment, comment)
    |> assign(:name, task.name)
    |> assign(:cta_url, Paths.project_task_path(company, task, comment) |> Paths.to_url())
    |> render("space_task_commented")
  end
end
