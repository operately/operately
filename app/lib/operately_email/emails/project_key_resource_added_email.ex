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
    action = get_action(content)
    resource_headline = get_resource_headline(content)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: action)
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:link, link)
    |> assign(:resource_title, content["title"])
    |> assign(:resource_link, content["link"])
    |> assign(:resource_headline, resource_headline)
    |> render("project_key_resource_added")
  end

  defp get_action(content) do
    case content["title"] do
      nil -> "added a resource"
      title -> "added the \"#{title}\" resource"
    end
  end

  defp get_resource_headline(content) do
    case content["title"] do
      nil -> "a resource"
      title -> "the \"#{title}\" resource"
    end
  end

  def buffered_item(_person, activity) do
    project = Operately.Projects.get_project!(activity.content["project_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    %{
      parent_id: project.id,
      parent_type: :project,
      parent_name: project.name,
      headline: "added a key resource",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
