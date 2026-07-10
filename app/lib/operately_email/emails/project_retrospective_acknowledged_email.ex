defmodule OperatelyEmail.Emails.ProjectRetrospectiveAcknowledgedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    retrospective = Projects.get_retrospective!(activity.content["retrospective_id"])
    project = Projects.get_project!(activity.content["project_id"])
    company = Repo.preload(project, :company).company

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "acknowledged your retrospective")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:retrospective, retrospective)
    |> assign(:cta_text, "View Retrospective")
    |> assign(:cta_url, OperatelyWeb.Paths.project_retrospective_path(company, project) |> OperatelyWeb.Paths.to_url())
    |> render("project_retrospective_acknowledged")
  end

  def buffered_item(_person, activity) do
    project = Operately.Projects.get_project!(activity.content["project_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    %{
      parent_id: project.id,
      parent_type: :project,
      parent_name: project.name,
      headline: "acknowledged a project retrospective",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
