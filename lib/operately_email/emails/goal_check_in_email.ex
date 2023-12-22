defmodule OperatelyEmail.Emails.GoalCheckInEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals, Updates}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])
    update = Updates.get_update!(activity.content["update_id"])

    company
    |> new()
    |> to(person)
    |> subject(who: author, action: "submitted a check-in for the #{goal.name} goal")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:update, update)
    |> render("goal_check_in")
  end
end
