defmodule OperatelyEmail.Emails.ProjectContributorAdditionEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    project = Projects.get_project!(activity.content["project_id"])
    contributor = Projects.get_contributor!(activity.content["contributor_id"])
    role = activity.content["role"]
    responsibility = construct_responsibility(contributor)
    link = OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "added you as a #{role}")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:responsibility, responsibility)
    |> assign(:role, role)
    |> assign(:link, link)
    |> render("project_contributor_addition")
  end

  def construct_responsibility(contributor) do
    case contributor.role do
      :champion -> "As a champion, you are responsible for leading the project, defining the scope, goals and timeline, and providing regular updates."
      :reviewer -> "As a reviewer, you are responsible for reviewing the progress of the project, providing feedback, and approving the final deliverables."
      :contributor -> "You are responsible for: #{contributor.responsibility}"
    end
  end
end
