defmodule Operately.Support.Features.FeedSteps do
  alias Operately.Support.Features.UI
  alias Operately.People.Person

  #
  # Goals
  #

  def assert_goal_added(ctx, author: author) do
    ctx |> assert_feed_item_exists(author, "added this goal", "")
  end

  def assert_goal_edited(ctx, author: author) do
    ctx |> assert_feed_item_exists(author, "edited the goal", "")
  end

  def assert_goal_edited(ctx, author: author, goal_name: name) do
    ctx |> assert_feed_item_exists(author, "edited the #{name} goal", "")
  end

  def assert_goal_checked_in(ctx, author: author, texts: texts) do
    UI.find(ctx, UI.query(testid: "goal-feed"), fn ctx ->
      assert_feed_item_exists(ctx, author, "updated the progress", "")

      Enum.reduce(texts, ctx, fn text, ctx ->
        UI.assert_text(ctx, text)
      end)
    end)
  end

  def assert_goal_checked_in(ctx, author: author, goal_name: goal_name, texts: texts) do
    ctx |> assert_feed_item_exists(author, "updated the progress in the #{goal_name}", "")

    Enum.reduce(texts, ctx, fn text, ctx ->
      UI.assert_text(ctx, text)
    end)
  end

  def assert_goal_check_in_acknowledgement(ctx, author: author) do
    ctx |> assert_feed_item_exists(author, "acknowledged the Progress Update", "")
  end

  def assert_goal_check_in_acknowledgement(ctx, author: author, goal_name: goal_name) do
    ctx |> assert_feed_item_exists(author, "acknowledged the Progress Update in the #{goal_name} goal", "")
  end

  def assert_goal_check_in_commented(ctx, author: author, comment: comment) do
    ctx |> assert_feed_item_exists(author, "commented on Update", comment)
  end

  def assert_goal_check_in_commented(ctx, author: author, goal_name: goal_name, comment: comment) do
    ctx |> assert_feed_item_exists(author, "commented on Update in the #{goal_name} goal", comment)
  end

  #
  # Projects
  #

  def assert_project_created(ctx, author: author) do
    ctx |> assert_feed_item_exists(author, "created the project", "")
  end

  def assert_project_created(ctx, author: author, project_name: project_name) do
    ctx |> assert_feed_item_exists(author, "created the #{project_name} project", "")
  end

  def assert_project_moved(ctx, author: author, old_space: old_space, new_space: new_space) do
    ctx |> assert_feed_item_exists(author, "moved the project", "From #{old_space.name} to #{new_space.name}")
  end

  def assert_project_archived(ctx, author: author) do
    ctx |> assert_feed_item_exists(author, "archived this project", "")
  end

  def assert_project_retrospective_posted(ctx, author: author) do
    ctx |> assert_feed_item_exists(author, "closed the project and submitted a retrospective", "")
  end

  def assert_project_paused(ctx, author: author) do
    ctx |> assert_feed_item_exists(author, "paused the project", "")
  end

  def assert_project_paused(ctx, author: author, project_name: project_name) do
    ctx |> assert_feed_item_exists(author, "paused the #{project_name} project", "")
  end

  def assert_project_resumed(ctx, author: author) do
    ctx |> assert_feed_item_exists(author, "resumed the project", "")
  end

  def assert_project_resumed(ctx, author: author, project_name: project_name) do
    ctx |> assert_feed_item_exists(author, "resumed the #{project_name} project", "")
  end

  def assert_project_renamed(ctx, author: author) do
    ctx |> assert_feed_item_exists(author, "renamed the project", "")
  end

  def assert_project_renamed(ctx, author: author, project_name: project_name) do
    ctx |> assert_feed_item_exists(author, "renamed the #{project_name} project", "")
  end

  def assert_project_milestone_commented(ctx, author: author, milestone_tile: milestone_title, comment: comment) do
    ctx |> assert_feed_item_exists(author, "commented on the #{milestone_title} milestone", comment)
  end

  def assert_project_goal_connection(ctx, author: author, goal_name: goal_name) do
    ctx |> assert_feed_item_exists(author, "connected the project to the #{goal_name} goal", "")
  end

  def assert_project_goal_connection(ctx, author: author, project_name: project_name) do
    ctx |> assert_feed_item_exists(author, "connected the #{project_name} project to the goal", "")
  end

  def assert_project_goal_connection(ctx, author: author, project_name: project_name, goal_name: goal_name) do
    ctx |> assert_feed_item_exists(author, "connected the #{project_name} project to the #{goal_name} goal", "")
  end

  def assert_project_key_resource_added(ctx, author: author) do
    ctx |> assert_feed_item_exists(author, "added a key resource to the project", "")
  end

  def assert_project_key_resource_added(ctx, author: author, project_name: project_name) do
    ctx |> assert_feed_item_exists(author, "added a key resource to the #{project_name} project", "")
  end

  def assert_project_timeline_edited(ctx, attrs) do
    title = case Keyword.get(attrs, :project_name, nil) do
      nil -> "edited the timeline"
      name -> "edited the timeline on the #{name} project"
    end
    author = Keyword.get(attrs, :author)
    messages = Keyword.get(attrs, :messages)

    ctx
    |> UI.assert_text(Person.first_name(author))
    |> UI.assert_text(title)
    |> then(fn ctx ->
      Enum.each(messages, fn message ->
        ctx |> UI.assert_text(message)
      end)

      ctx
    end)
  end

  #
  # Project Check-ins
  #

  def assert_project_check_in_submitted(ctx, author: author, description: description) do
    ctx
    |> assert_feed_item_exists(author, "submitted a Check-In", "On Track")
    |> UI.assert_text(description)
  end

  def assert_project_check_in_submitted(ctx, author: author, project_name: project_name, description: description) do
    ctx
    |> assert_feed_item_exists(author, "submitted a Check-In in the #{project_name} project", "On Track")
    |> UI.assert_text(description)
  end

  def assert_project_check_in_acknowledged(ctx, author: author) do
    ctx
    |> assert_feed_item_exists(author, "acknowledged a Check-In", "")
  end

  def assert_project_check_in_acknowledged(ctx, author: author, project_name: project_name) do
    ctx
    |> assert_feed_item_exists(author, "acknowledged a Check-In in the #{project_name} project", "")
  end

  def assert_project_check_in_commented(ctx, author: author, comment: comment) do
    ctx |> assert_feed_item_exists(author, "commented on Check-In", comment)
  end

  #
  # Utility functions
  #

  def assert_feed_item_exists(ctx, %{author: author, title: title}) do
    ctx |> assert_feed_item_exists(author, title, "")
  end

  def assert_feed_item_exists(ctx, %{author: author, title: title, subtitle: subtitle}) do
    ctx |> assert_feed_item_exists(author, title, subtitle)
  end

  def assert_feed_item_exists(ctx, author, title, subtitle) do
    ctx
    |> UI.assert_text(Person.first_name(author))
    |> UI.assert_text(title)
    |> UI.assert_text(subtitle)
  end
end
