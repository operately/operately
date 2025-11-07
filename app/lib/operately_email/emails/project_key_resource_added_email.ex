defmodule OperatelyEmail.Emails.ProjectKeyResourceAddedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Projects.Project
  def send(person, activity) do
    content = activity.content
    {:ok, project = %{company: company}} = Project.get(:system, id: content["project_id"], opts: [
      preload: [:company]
    ])
    author = Operately.Repo.preload(activity, :author).author
    link = OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url()
    resource_title = content["title"]
    resource_link = content["link"]

    action =
      case resource_title do
        nil -> "added a resource to resources"
        title -> "added #{title} to resources"
      end

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: action)
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:link, link)
    |> assign(:resource_title, resource_title)
    |> assign(:resource_link, resource_link)
    |> render("project_key_resource_added")
  end
end
