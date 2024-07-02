defmodule OperatelyEmail.Emails.GoalCreatedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])
    role = Goals.get_role(goal, person) |> Atom.to_string()
    space = Operately.Groups.get_group!(goal.group_id)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: space.name, who: author, action: "added the #{goal.name} goal")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:role, role)
    |> assign(:cta_url, OperatelyWeb.Paths.goal_path(company, goal))
    |> render("goal_created")
  end
end
