defmodule OperatelyEmail.Emails.ProjectClosedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.{Repo, Projects}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    project = Projects.get_project!(activity.content["project_id"])
    company = Repo.preload(project, :company).company

    company
    |> new()
    |> to(person)
    |> subject(who: author, action: "closed the #{project.name} project and submitted a retrospective")
    |> assign(:project, project)
    |> assign(:author, author)
    |> render("project_closed")
  end
end
