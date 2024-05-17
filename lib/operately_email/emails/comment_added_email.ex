defmodule OperatelyEmail.Emails.CommentAddedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.Repo

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    comment = Operately.Updates.get_comment!(activity.content["comment_id"])

    where = get_where(activity)
    action = get_action(activity)
    link = get_link(activity)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: where, who: author, action: action)
    |> assign(:author, author)
    |> assign(:comment, comment)
    |> assign(:action, action)
    |> assign(:link, link)
    |> render("comment_added")
  end

  def get_where(activity) do
    cond do
      activity.content["goal_id"] ->
        project = Operately.Goals.get_goal!(activity.content["goal_id"])
        project.name

      true ->
        raise "Unsupported location"
    end
  end

  def get_action(activity) do
    comment_thread = Operately.Comments.get_thread!(activity.content["comment_thread_id"])
    activity = Operately.Activities.get_activity!(comment_thread.parent_id)

    cond do
      activity.action == "goal_timeframe_editing" ->
        "commented on the goal timeframe change"

      activity.action == "goal_closing" ->
        "commented on goal closing"

      activity.action == "goal_discussion_creation" ->
        parent_comment_thread = Operately.Comments.get_thread!(activity.comment_thread_id)

        "commented on: #{parent_comment_thread.title}"

      true ->
        raise "Unsupported action"
    end
  end

  def get_link(activity) do
    comment_thread = Operately.Comments.get_thread!(activity.content["comment_thread_id"])
    activity = Operately.Activities.get_activity!(comment_thread.parent_id)

    cond do
      activity.action == "goal_timeframe_editing" ->
        OperatelyEmail.goal_activity_url(activity.content["goal_id"], activity.id)

      activity.action == "goal_closing" ->
        OperatelyEmail.goal_activity_url(activity.content["goal_id"], activity.id)

      activity.action == "goal_discussion_creation" ->
        OperatelyEmail.goal_activity_url(activity.content["goal_id"], activity.id)

      true ->
        raise "Unsupported action"
    end
  end

end
