defmodule OperatelyEmail.Emails.GoalDiscussionCreationEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])

    comment_thread = Repo.preload(activity, :comment_thread).comment_thread
    title = comment_thread.title
    message = comment_thread.message
    link = OperatelyEmail.goal_activity_url(goal.id, activity.id)

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
