defmodule OperatelyEmail.Emails.GoalReopeningEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  def send(person, activity) do
    raise "Email for GoalReopening not implemented"

    # author = Repo.preload(activity, :author).author

    # company
    # |> new()
    # |> to(person)
    # |> subject(who: author, action: "did something")
    # |> assign(:author, author)
    # |> render("goal_reopening")
  end
end
