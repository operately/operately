defmodule OperatelyEmail.Emails.GoalReparentEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])
    new_parent_goal = Goals.get_goal!(activity.content["new_parent_goal_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: goal.name, who: author, action: "changed the goal parent of #{goal.name}")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:new_parent_goal, new_parent_goal)
    |> assign(:cta_url, OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url())
    |> render("goal_reparent")
  end
end
