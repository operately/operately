defmodule OperatelyEmail.Emails.ProjectClosedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.{Repo, Projects}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    project = Projects.get_project!(activity.content["project_id"])
    company = Repo.preload(project, :company).company
    link = OperatelyWeb.Paths.project_retrospective_path(company, project) |> OperatelyWeb.Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "closed the project and submitted a retrospective")
    |> assign(:project, project)
    |> assign(:author, author)
    |> assign(:link, link)
    |> render("project_closed")
  end
end
