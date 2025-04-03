defmodule OperatelyEmail.Emails.GoalClosingEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])
    space = Operately.Groups.get_group!(goal.group_id)
    activity = Operately.Repo.preload(activity, :comment_thread)
    link = Paths.goal_activity_path(company, activity) |> Paths.to_url()

    success = activity.content["success"]
    message = activity.comment_thread.message

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: space.name, who: author, action: "closed the #{goal.name} goal")
    |> assign(:goal, goal)
    |> assign(:author, author)
    |> assign(:link, link)
    |> assign(:success, success)
    |> assign(:message, message)
    |> render("goal_closing")
  end
end
