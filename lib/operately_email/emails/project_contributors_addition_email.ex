defmodule OperatelyEmail.Emails.ProjectContributorsAdditionEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    project = Projects.get_project!(activity.content.project_id)
    contributor = Projects.get_contributor!(person_id: person.id, project_id: project.id)
    link = OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "added you as a contributor")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:responsibility, contributor.responsibility)
    |> assign(:link, link)
    |> render("project_contributors_addition")
  end
end
