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
end
