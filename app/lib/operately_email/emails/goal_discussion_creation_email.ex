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

  def buffered_item(_person, activity) do
    goal = Operately.Goals.get_goal!(activity.content["goal_id"])
    discussion = Operately.Comments.get_thread!(activity.comment_thread_id)
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(discussion.message)

    %{
      parent_id: goal.id,
      parent_type: :goal,
      parent_name: goal.name,
      headline: "started a goal discussion: #{discussion.title}",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
