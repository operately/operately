defmodule OperatelyEmail.Emails.ProjectContributorAdditionEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    project = Projects.get_project!(activity.content["project_id"])
    contributor = Projects.get_contributor!(activity.content["contributor_id"])
    role = role_label(activity.content["role"])
    responsibility = construct_responsibility(contributor)
    link = OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(gettext("(%{project_name}) %{author} added you as a %{role}", project_name: project.name, author: Operately.People.Person.short_name(author), role: role))
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:responsibility, responsibility)
    |> assign(:role, role)
    |> assign(:link, link)
    |> render("project_contributor_addition")
  end

  defp role_label("champion"), do: gettext("champion")
  defp role_label("reviewer"), do: gettext("reviewer")
  defp role_label("contributor"), do: gettext("contributor")
  defp role_label(role), do: role

  def construct_responsibility(contributor) do
    case contributor.role do
      :champion -> gettext("As a champion, you are responsible for leading the project, defining the scope, goals and timeline, and providing regular updates.")
      :reviewer -> gettext("As a reviewer, you are responsible for reviewing the progress of the project, providing feedback, and approving the final deliverables.")
      :contributor -> gettext("You are responsible for: %{contributor_responsibility}", contributor_responsibility: contributor.responsibility)
    end
  end
end
