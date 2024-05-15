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
    |> from(author)
    |> to(person)
    |> subject(where: goal.name, who: author, action: "updated the progress")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:update, update)
    |> render("goal_check_in")
  end
end
