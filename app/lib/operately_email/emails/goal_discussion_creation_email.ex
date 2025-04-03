defmodule OperatelyEmail.Emails.GoalDiscussionCreationEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])

    activity = Repo.preload(activity, :comment_thread)
    comment_thread = activity.comment_thread
    title = comment_thread.title
    message = comment_thread.message
    link = Paths.goal_activity_path(company, activity) |> Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: goal.name, who: author, action: "posted: #{title}")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:title, title)
    |> assign(:message, message)
    |> assign(:link, link)
    |> render("goal_discussion_creation")
  end
end
