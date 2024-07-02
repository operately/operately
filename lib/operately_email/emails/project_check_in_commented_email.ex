defmodule OperatelyEmail.Emails.ProjectCheckInCommentedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects, Updates}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    check_in = Projects.get_check_in!(activity.content["check_in_id"])
    project = Projects.get_project!(activity.content["project_id"])
    comment = Updates.get_comment!(activity.content["comment_id"])
    company = Repo.preload(project, :company).company
    link = OperatelyWeb.Paths.project_check_in_path(company, project, check_in) |> OperatelyWeb.Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "commented on a check-in")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:check_in, check_in)
    |> assign(:comment, comment)
    |> assign(:cta_text, "View Check-In")
    |> assign(:cta_url, link)
    |> render("project_check_in_commented")
  end
end
