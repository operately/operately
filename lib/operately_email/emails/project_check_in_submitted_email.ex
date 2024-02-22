defmodule OperatelyEmail.Emails.ProjectCheckInSubmittedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects, Updates}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    update = Updates.get_update!(activity.content["check_in_id"])
    project = Projects.get_project!(update.updatable_id)
    company = Repo.preload(project, :company).company

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: action(update))
    |> assign(:action, action(update))
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:update, update)
    |> render("project_check_in_submitted")
  end

  defp action(update) do
    if update.content["health"]["status"]["value"] == "paused" do
      "paused the project"
    else
      "submitted a check-in"
    end
  end
end
