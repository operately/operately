defmodule OperatelyEmail.Emails.ProjectCheckInSubmittedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    project = Projects.get_project!(activity.content["project_id"])
    check_in = Projects.get_check_in!(activity.content["check_in_id"])
    company = Operately.Repo.preload(project, :company).company

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "submitted a check-in")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:check_in, check_in)
    |> assign(:cta_url, OperatelyEmail.project_check_in_url(project.id, check_in.id))
    |> assign(:cta_text, "View Check-In")
    |> render("project_check_in_submitted")
  end
end
