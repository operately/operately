defmodule OperatelyEmail.Emails.ProjectGoalDisconnectionEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  def send(person, activity) do
    raise "Email for ProjectGoalDisconnection not implemented"

    # author = Repo.preload(activity, :author).author

    # company
    # |> new()
    # |> to(person)
    # |> subject(who: author, action: "did something")
    # |> assign(:author, author)
    # |> render("project_goal_disconnection")
  end
end
