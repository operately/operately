defmodule OperatelyEmail.Emails.GoalCreatedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])
    role = Goals.get_role(goal, person) |> Atom.to_string()

    company
    |> new()
    |> to(person)
    |> subject(who: author, action: "added the #{goal.name} goal")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:role, role)
    |> render("goal_created")
  end
end
