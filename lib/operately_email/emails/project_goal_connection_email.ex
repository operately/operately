defmodule OperatelyEmail.Emails.ProjectGoalConnectionEmail do
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
    |> to(person)
    |> subject(who: author, action: "connected the #{project.name} project to the #{goal.name} goal")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:goal, goal)
    |> render("project_goal_connection")
  end
end
