defmodule OperatelyEmail.Emails.ProjectDiscussionSubmittedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Comments.CommentThread
  alias Operately.Projects.Project
  alias Operately.Repo
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    {:ok, project} = Project.get(:system, id: activity.content["project_id"])
    {:ok, discussion} = CommentThread.get(:system, id: activity.content["discussion_id"])

    title = discussion.title
    message = discussion.message
    link = Paths.project_discussion_path(company, discussion) |> Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "posted: #{title}")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:title, title)
    |> assign(:message, message)
    |> assign(:link, link)
    |> render("project_discussion_submitted")
  end

  def buffered_item(_person, activity) do
    project = Operately.Projects.get_project!(activity.content["project_id"])
    discussion = Operately.Comments.get_thread!(activity.content["discussion_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(discussion.message)

    %{
      parent_id: project.id,
      parent_type: :project,
      parent_name: project.name,
      headline: "started the project discussion \"#{discussion.title}\"",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
