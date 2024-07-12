defmodule OperatelyEmail.Emails.GoalCheckInAcknowledgementEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo,Goals, Updates}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    update = Updates.get_update!(activity.content["update_id"])
    goal = Goals.get_goal!(activity.content["goal_id"])
    company = Repo.preload(author, :company).company

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: goal.name, who: author, action: "acknowledged your progress update")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:update, update)
    |> assign(:cta_url, OperatelyWeb.Paths.goal_check_in_path(company, update) |> OperatelyWeb.Paths.to_url())
    |> render("goal_check_in_acknowledgement")
  end
end
