defmodule OperatelyEmail.Emails.ProjectCheckInCommentedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects}
  alias Operately.Updates.Comment

  def send(person, activity) do
    case Repo.get(Comment, activity.content["comment_id"]) do
      nil -> :skip
      comment -> send_email(person, activity, comment)
    end
  end

  defp send_email(person, activity, comment) do
    author = Repo.preload(activity, :author).author
    check_in = Projects.get_check_in!(activity.content["check_in_id"])
    project = Projects.get_project!(activity.content["project_id"])
    company = Repo.preload(project, :company).company
    link = OperatelyWeb.Paths.project_check_in_path(company, check_in, comment) |> OperatelyWeb.Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(gettext("(%{location}) %{author} commented on a check-in", location: project.name, author: Operately.People.Person.short_name(author)))
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:check_in, check_in)
    |> assign(:comment, comment)
    |> assign(:cta_text, gettext("View Comment"))
    |> assign(:cta_url, link)
    |> render("project_check_in_commented")
  end

  def buffered_item(_person, activity) do
    case Repo.get(Comment, activity.content["comment_id"]) do
      nil -> :skip
      comment -> build_buffered_item(activity, comment)
    end
  end

  defp build_buffered_item(activity, comment) do
    project = Operately.Projects.get_project!(activity.content["project_id"])
    check_in = Operately.Projects.get_check_in!(activity.content["check_in_id"])
    content = comment.content
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(content)

    %{
      parent_id: project.id,
      parent_type: :project,
      parent_name: project.name,
      headline: gettext("commented on a project check-in"),
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.project_check_in_path(company, check_in, comment) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
