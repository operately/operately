defmodule OperatelyEmail.Emails.ProjectCreatedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    project = Projects.get_project!(activity.content["project_id"])
    company = Repo.preload(project, :company).company
    role = Operately.Projects.get_contributor_role!(project, person.id) |> stringify_role()
    author_role = Operately.Projects.get_contributor_role!(project, author.id) |> stringify_role()

    company
    |> new()
    |> to(person)
    |> subject(who: author, action: "added the #{project.name} project")
    |> assign(:author, author)
    |> assign(:author_role, author_role)
    |> assign(:role, role)
    |> assign(:project, project)
    |> render("project_created")
  end

  defp stringify_role(role) do
    case role do
      :champion -> "Champion"
      :reviewer -> "Reviewer"
      :contributor -> "Contributor"
      nil -> nil
    end
  end
end
