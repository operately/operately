defmodule OperatelyEmail.Emails.ProjectResumingEmail do
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
    |> subject(where: project.name, who: author, action: "resumed the project")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:link, link)
    |> assign(:message, message)
    |> render("project_resuming")
  end

  def buffered_item(_person, activity) do
    project = Operately.Projects.get_project!(activity.content["project_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    %{
      parent_id: project.id,
      parent_type: :project,
      parent_name: project.name,
      headline: "resumed this project",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
