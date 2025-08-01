defmodule OperatelyEmail.Emails.CommentAddedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.Repo
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    comment = Operately.Updates.get_comment!(activity.content["comment_id"])

    where = get_where(activity)
    action = get_action(activity)
    link = get_link(company, activity, comment)

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
        goal = Operately.Goals.get_goal!(activity.content["goal_id"])
        goal.name

      activity.content["project_id"] ->
        project = Operately.Projects.get_project!(activity.content["project_id"])
        project.name

      true ->
        raise "Unsupported location"
    end
  end

  def get_action(activity) do
    comment_thread = Operately.Comments.get_thread!(activity.content["comment_thread_id"])
    activity = Operately.Repo.preload(comment_thread, :activity).activity

    cond do
      activity.action == "goal_timeframe_editing" ->
        "commented on the goal timeframe change"

      activity.action == "goal_closing" ->
        "commented on goal closing"

      activity.action == "goal_discussion_creation" ->
        parent_comment_thread = Operately.Comments.get_thread!(activity.comment_thread_id)

        "commented on: #{parent_comment_thread.title}"

      activity.action == "goal_reopening" ->
        "commented on goal reopening"

      activity.action == "project_discussion_submitted" ->
        "commented on: #{comment_thread.title}"

      true ->
        raise "Unsupported action: #{activity.action}"
    end
  end

  def get_link(company, activity, comment) do
    comment_thread = Operately.Comments.get_thread!(activity.content["comment_thread_id"])
    activity = Operately.Repo.preload(comment_thread, :activity).activity
    activity = Repo.preload(activity, :comment_thread)

    cond do
      activity.action == "goal_timeframe_editing" ->
        Paths.goal_activity_path(company, activity, comment) |> Paths.to_url()

      activity.action == "goal_closing" ->
        Paths.goal_activity_path(company, activity, comment) |> Paths.to_url()

      activity.action == "goal_discussion_creation" ->
        Paths.goal_activity_path(company, activity, comment) |> Paths.to_url()

      activity.action == "goal_reopening" ->
        Paths.goal_activity_path(company, activity, comment) |> Paths.to_url()

      activity.action == "project_discussion_submitted" ->
        Paths.project_discussion_path(company, comment_thread) |> Paths.to_url()

      true ->
        raise "Unsupported action"
    end
  end
end
