defmodule OperatelyEmail.Emails.ProjectPausingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  def send(person, activity) do
    author = Operately.Repo.preload(activity, :author).author
    project = Operately.Projects.get_project!(activity.content["project_id"])
    company = Operately.Repo.preload(project, :company).company
    link = OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url()
    message = Operately.Repo.preload(activity, :comment_thread).comment_thread.message

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "paused the project")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:link, link)
    |> assign(:message, message)
    |> render("project_pausing")
  end

  def buffered_item(_person, activity) do
    project = Operately.Projects.get_project!(activity.content["project_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    comment_thread = Operately.Repo.preload(activity, :comment_thread).comment_thread
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(comment_thread.message)

    %{
      parent_id: project.id,
      parent_type: :project,
      parent_name: project.name,
      headline: "paused the project",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
