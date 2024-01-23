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

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "disconnected the project from the #{goal.name} goal")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:goal, goal)
    |> render("project_goal_disconnection")
  end
end
