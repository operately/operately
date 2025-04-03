defmodule OperatelyEmail.Emails.ProjectGoalDisconnectionEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.Projects
  alias Operately.Goals

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    project = Projects.get_project!(activity.content["project_id"])
    goal = Goals.get_goal!(activity.content["goal_id"])
    company = Repo.preload(project, :company).company
    link = OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "disconnected the project from the #{goal.name} goal")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:goal, goal)
    |> assign(:link, link)
    |> render("project_goal_disconnection")
  end
end
