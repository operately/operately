defmodule OperatelyEmail.Emails.GoalCheckInCommentedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals, Updates}
  alias Operately.Goals.Update
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])
    {:ok, update} = Update.get(:system, id: activity.content["goal_check_in_id"])
    comment = Updates.get_comment!(activity.content["comment_id"])
    action = "commented on the progress update"

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: goal.name, who: author, action: action)
    |> assign(:action, action)
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:update, update)
    |> assign(:comment, comment)
    |> assign(:link, Paths.goal_check_in_path(company, update) |> Paths.to_url())
    |> render("goal_check_in_commented")
  end
end
