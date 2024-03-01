defmodule OperatelyEmail.Emails.ProjectResumingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  def send(person, activity) do
    author = Operately.Repo.preload(activity, :author).author
    project = Operately.Projects.get_project!(activity.content["project_id"])
    company = Operately.Repo.preload(project, :company).company

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "resumed the project")
    |> assign(:author, author)
    |> assign(:project, project)
    |> render("project_resuming")
  end
end
