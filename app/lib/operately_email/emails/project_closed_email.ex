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

  def buffered_item(_person, activity) do
    project = Operately.Projects.get_project!(activity.content["project_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    %{
      parent_id: project.id,
      parent_type: :project,
      parent_name: project.name,
      headline: "closed this project",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
