defmodule OperatelyEmail.Emails.GoalClosingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  def send(person, activity) do
    raise "Email for GoalClosing not implemented"

    # author = Repo.preload(activity, :author).author

    # company
    # |> new()
    # |> to(person)
    # |> subject(who: author, action: "did something")
    # |> assign(:author, author)
    # |> render("goal_closing")
  end
end
