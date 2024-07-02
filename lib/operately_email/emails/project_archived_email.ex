defmodule OperatelyEmail.Emails.ProjectArchivedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    project = Projects.get_project!(activity.content["project_id"])
    company = Repo.preload(project, :company).company
    space = Operately.Groups.get_group!(project.group_id)
    link = OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: space.name, who: author, action: "archived the #{project.name} project")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:link, link)
    |> render("project_archived")
  end
end
