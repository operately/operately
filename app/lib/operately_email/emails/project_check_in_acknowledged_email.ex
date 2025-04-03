defmodule OperatelyEmail.Emails.ProjectCheckInAcknowledgedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    check_in = Projects.get_check_in!(activity.content["check_in_id"])
    project = Projects.get_project!(activity.content["project_id"])
    company = Repo.preload(project, :company).company

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "acknowledged your check-in")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:check_in, check_in)
    |> assign(:cta_text, "View Check-In")
    |> assign(:cta_url, OperatelyWeb.Paths.project_check_in_path(company, check_in) |> OperatelyWeb.Paths.to_url())
    |> render("project_check_in_acknowledged")
  end
end
