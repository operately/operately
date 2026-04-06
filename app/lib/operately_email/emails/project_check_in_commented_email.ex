defmodule OperatelyEmail.Emails.ProjectCheckInCommentedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects, Updates}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    check_in = Projects.get_check_in!(activity.content["check_in_id"])
    project = Projects.get_project!(activity.content["project_id"])
    comment = Updates.get_comment!(activity.content["comment_id"])
    company = Repo.preload(project, :company).company
    link = OperatelyWeb.Paths.project_check_in_path(company, check_in, comment) |> OperatelyWeb.Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "commented on a check-in")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:check_in, check_in)
    |> assign(:comment, comment)
    |> assign(:cta_text, "View Comment")
    |> assign(:cta_url, link)
    |> render("project_check_in_commented")
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
      headline: "commented on a project check-in",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
