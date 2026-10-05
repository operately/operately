defmodule OperatelyEmail.Emails.ProjectRetrospectiveCommentedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
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

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(gettext("(%{location}) %{author} commented on the project retrospective", location: space.name, author: Operately.People.Person.short_name(author)))
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:comment, comment)
    |> assign(:cta_text, gettext("View Retrospective"))
    |> assign(:cta_url, Paths.project_retrospective_path(company, project, comment) |> Paths.to_url())
    |> render("project_retrospective_commented")
  end

  def buffered_item(_person, activity) do
    project = Operately.Projects.get_project!(activity.content["project_id"])
    comment = Operately.Updates.get_comment!(activity.content["comment_id"])
    content = comment.content
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(content)

    %{
      parent_id: project.id,
      parent_type: :project,
      parent_name: project.name,
      headline: gettext("commented on the project retrospective"),
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.project_retrospective_path(company, project, comment) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
