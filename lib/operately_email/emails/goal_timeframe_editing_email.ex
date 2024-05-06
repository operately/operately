defmodule OperatelyEmail.Emails.GoalTimeframeEditingEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])

    old_timeframe = Operately.Goals.Timeframe.parse_json!(activity.content["old_timeframe"])
    new_timeframe = Operately.Goals.Timeframe.parse_json!(activity.content["new_timeframe"])

    message = Operately.Repo.preload(activity, :comment_thread).comment_thread.message
    link = OperatelyEmail.goal_activity_url(goal.id, activity.id)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: goal.name, who: author, action: "edited the timeframe")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:old_timeframe, old_timeframe)
    |> assign(:new_timeframe, new_timeframe)
    |> assign(:message, message)
    |> assign(:link, link)
    |> render("goal_timeframe_editing")
  end
end
