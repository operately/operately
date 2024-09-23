defmodule OperatelyEmail.Emails.ProjectClosedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.Projects.Project

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    {:ok, project} = Project.get(:system, id: activity.content["project_id"], opts: [
      preload: [:company, :retrospective]
    ])

    link = OperatelyWeb.Paths.project_retrospective_path(project.company, project) |> OperatelyWeb.Paths.to_url()

    project.company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "closed the project and submitted a retrospective")
    |> assign(:project, project)
    |> assign(:retrospective, project.retrospective)
    |> assign(:author, author)
    |> assign(:link, link)
    |> render("project_closed")
  end
end
