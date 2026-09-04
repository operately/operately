defmodule OperatelyEmail.Emails.ProjectClosedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.Projects
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author

    project =
      activity.content["project_id"]
      |> Projects.get_project!()
      |> Repo.preload([:company, :retrospective, :champion, :reviewer])

    {cta_text, cta_url} = construct_cta_text_and_url(person, project, author)

    project.company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "closed the project and submitted a retrospective")
    |> assign(:project, project)
    |> assign(:retrospective, project.retrospective)
    |> assign(:author, author)
    |> assign(:link, cta_url)
    |> assign(:cta_text, cta_text)
    |> render("project_closed")
  end

  defp construct_cta_text_and_url(person, project, author) do
    url = Paths.project_retrospective_path(project.company, project) |> Paths.to_url()

    OperatelyEmail.AcknowledgeCta.build(
      person,
      author.id,
      [project.reviewer, project.champion],
      url,
      "View Retrospective"
    )
  end

  def buffered_item(_person, activity) do
    project = Operately.Projects.get_project!(activity.content["project_id"])
    retrospective = Operately.Projects.get_retrospective!(activity.content["retrospective_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(retrospective.content)

    %{
      parent_id: project.id,
      parent_type: :project,
      parent_name: project.name,
      headline: "closed the project",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: Paths.project_retrospective_path(company, project) |> Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
