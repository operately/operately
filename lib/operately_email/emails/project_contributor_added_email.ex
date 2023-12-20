defmodule OperatelyEmail.Emails.ProjectContributorAddedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    project = Projects.get_project!(activity.updatable_id)
    contributor = Projects.get_contributor!(person_id: person.id, project_id: project.id)

    role = stringify_role(contributor.role)
    responsibility = construct_responsibility(contributor)

    company
    |> new()
    |> to(person)
    |> subject(who: author, action: "added you as a #{role} on #{project.name}")
    |> assign(:author, author)
    |> assign(:role, role)
    |> assign(:project, project)
    |> assign(:responsibility, responsibility)
    |> render("project_contributor_added")
  end

  def stringify_role(role) do
    case role do
      :champion -> "Champion"
      :reviewer -> "Reviewer"
      :contributor -> "Contributor"
    end
  end

  def construct_responsibility(contributor) do
    case contributor.role do
      :champion -> "As a champion, you are responsible for leading the project, defining the scope, goals and timeline, and providing regular updates."
      :reviewer -> "As a reviewer, you are responsible for reviewing the progress of the project, providing feedback, and approving the final deliverables."
      :contributor -> "You are responsible for: #{contributor.responsibility}"
    end
  end
end
