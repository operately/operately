defmodule OperatelyEmail.Emails.ProjectRetrospectiveCommentedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.{Repo, Updates}
  alias Operately.Projects.Project
  alias OperatelyWeb.Paths

  def send(person, activity) do
    %{author: author} = Repo.preload(activity, [:author])
    {:ok, project = %{group: space, company: company}} = Project.get(:system, id: activity.content["project_id"], opts: [
      preload: [:group, :company]
    ])
    comment = Updates.get_comment!(activity.content["comment_id"])
    action = "commented on the project retrospective"

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: space.name, who: author, action: action)
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:comment, comment)
    |> assign(:cta_text, "View Retrospective")
    |> assign(:cta_url, Paths.project_retrospective_path(company, project, comment) |> Paths.to_url())
    |> render("project_retrospective_commented")
  end

  def buffered_item(_person, activity) do
    project = Operately.Projects.get_project!(activity.content["project_id"])
    comment = Operately.Updates.get_comment!(activity.content["comment_id"])
    content = comment.content["message"]
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(content)

    %{
      parent_id: project.id,
      parent_type: :project,
      parent_name: project.name,
      headline: "commented on the project retrospective",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
