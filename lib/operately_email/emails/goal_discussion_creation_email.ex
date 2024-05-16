defmodule OperatelyEmail.Emails.GoalDiscussionCreationEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  def send(person, activity) do
    raise "Email for GoalDiscussionCreation not implemented"

    # author = Repo.preload(activity, :author).author

    # company
    # |> new()
    # |> to(person)
    # |> subject(who: author, action: "did something")
    # |> assign(:author, author)
    # |> render("goal_discussion_creation")
  end
end
