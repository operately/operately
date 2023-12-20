defmodule OperatelyEmail.Emails.ProjectStatusUpdateCommentedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects, Updates}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    update = Updates.get_update!(activity.content["status_update_id"])
    project = Projects.get_project!(update.updatable_id)
    comment = Updates.get_comment!(activity.content["comment_id"])
    company = Repo.preload(project, :company).company

    company
    |> new()
    |> to(person)
    |> subject(who: author, action: "commented on a check-in for #{project.name}")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:update, update)
    |> assign(:comment, comment)
    |> render("project_status_update_commented")
  end
end
