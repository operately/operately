defmodule OperatelyEmail.Emails.CommentAddedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.Repo
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    comment = Operately.Updates.get_comment!(activity.content["comment_id"])

    where = get_where(activity)
    context = comment_context(activity)
    link = get_link(company, activity, comment)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(subject_text(author, where, context))
    |> assign(:author, author)
    |> assign(:comment, comment)
    |> assign(:comment_context, context)
    |> assign(:link, link)
    |> render("comment_added")
  end

  defp comment_context(activity) do
    thread = Operately.Comments.get_thread!(activity.content["comment_thread_id"])
    parent_activity = Repo.preload(thread, :activity).activity

    case parent_activity.action do
      "goal_discussion_creation" ->
        parent_thread = Operately.Comments.get_thread!(parent_activity.comment_thread_id)
        {:discussion, parent_thread.title}

      "project_discussion_submitted" ->
        {:discussion, thread.title}

      "goal_timeframe_editing" ->
        {:goal_timeframe_editing, nil}

      "goal_closing" ->
        {:goal_closing, nil}

      "goal_reopening" ->
        {:goal_reopening, nil}

      "project_resuming" ->
        {:project_resuming, nil}

      "project_pausing" ->
        {:project_pausing, nil}

      _ ->
        raise "Unsupported action: #{parent_activity.action}"
    end
  end

  def subject_text(author, location, context) do
    case context do
      {:goal_timeframe_editing, _} ->
        gettext("(%{location}) %{author} commented on the goal timeframe change", location: location, author: Operately.People.Person.short_name(author))

      {:goal_closing, _} ->
        gettext("(%{location}) %{author} commented on the goal closing", location: location, author: Operately.People.Person.short_name(author))

      {:goal_reopening, _} ->
        gettext("(%{location}) %{author} commented on the goal reopening", location: location, author: Operately.People.Person.short_name(author))

      {:project_resuming, _} ->
        gettext("(%{location}) %{author} commented on the project resumption", location: location, author: Operately.People.Person.short_name(author))

      {:project_pausing, _} ->
        gettext("(%{location}) %{author} commented on the project pausing", location: location, author: Operately.People.Person.short_name(author))

      {:discussion, title} ->
        gettext("(%{location}) %{author} commented on: %{title}", location: location, author: Operately.People.Person.short_name(author), title: title)
    end
  end

  def heading(author, context) do
    case context do
      {:goal_timeframe_editing, _} ->
        gettext("%{author} commented on the goal timeframe change", author: Operately.People.Person.short_name(author))

      {:goal_closing, _} ->
        gettext("%{author} commented on the goal closing", author: Operately.People.Person.short_name(author))

      {:goal_reopening, _} ->
        gettext("%{author} commented on the goal reopening", author: Operately.People.Person.short_name(author))

      {:project_resuming, _} ->
        gettext("%{author} commented on the project resumption", author: Operately.People.Person.short_name(author))

      {:project_pausing, _} ->
        gettext("%{author} commented on the project pausing", author: Operately.People.Person.short_name(author))

      {:discussion, title} ->
        gettext("%{author} commented on: %{title}", author: Operately.People.Person.short_name(author), title: title)
    end
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
        gettext("commented on the goal timeframe change")

      activity.action == "goal_closing" ->
        gettext("commented on the goal closing")

      activity.action == "goal_discussion_creation" ->
        parent_comment_thread = Operately.Comments.get_thread!(activity.comment_thread_id)

        gettext("commented on: %{title}", title: parent_comment_thread.title)

      activity.action == "goal_reopening" ->
        gettext("commented on the goal reopening")

      activity.action == "project_discussion_submitted" ->
        gettext("commented on: %{title}", title: comment_thread.title)

      activity.action == "project_resuming" ->
        gettext("commented on the project resumption")

      activity.action == "project_pausing" ->
        gettext("commented on the project pausing")

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
        Paths.project_discussion_path(company, comment_thread, comment) |> Paths.to_url()

      activity.action == "project_resuming" ->
        Paths.project_activity_path(company, activity, comment) |> Paths.to_url()

      activity.action == "project_pausing" ->
        Paths.project_activity_path(company, activity, comment) |> Paths.to_url()

      true ->
        raise "Unsupported action"
    end
  end

  def buffered_item(_person, activity) do
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    comment = Operately.Updates.get_comment!(activity.content["comment_id"])
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(comment.content)
    {parent_type, parent_id, parent_name} = digest_parent(activity)

    %{
      parent_id: parent_id,
      parent_type: parent_type,
      parent_name: parent_name,
      headline: get_action(activity),
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: get_link(company, activity, comment),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end

  defp digest_parent(activity) do
    cond do
      activity.content["goal_id"] ->
        goal = Operately.Goals.get_goal!(activity.content["goal_id"])
        {:goal, goal.id, goal.name}

      activity.content["project_id"] ->
        project = Operately.Projects.get_project!(activity.content["project_id"])
        {:project, project.id, project.name}

      activity.content["space_id"] ->
        space = Operately.Groups.get_group!(activity.content["space_id"])
        {:space, space.id, space.name}

      true ->
        raise "Unsupported location"
    end
  end
end
