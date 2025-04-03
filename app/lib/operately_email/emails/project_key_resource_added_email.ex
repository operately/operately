defmodule OperatelyEmail.Emails.ProjectKeyResourceAddedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Projects.Project

  def send(person, activity) do
    {:ok, project = %{company: company}} = Project.get(:system, id: activity.content["project_id"], opts: [
      preload: [:company]
    ])
    author = Operately.Repo.preload(activity, :author).author
    link = OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "key resource added")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:link, link)
    |> render("project_key_resource_added")
  end
end
