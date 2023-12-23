defmodule Operately.Support.Features.FeedSteps do
  alias Operately.Support.Features.UI
  alias Operately.People.Person

  def assert_goal_added(ctx, author: author) do
    ctx |> assert_feed_item_exists(author, "added this goal", "")
  end

  def assert_goal_check_in(ctx, author: author) do
    ctx |> assert_feed_item_exists(author, "submitted", "")
  end

  def assert_goal_check_in_acknowledgement(ctx, author: author) do
    ctx |> assert_feed_item_exists(author, "acknowledged", "")
  end

  def assert_project_moved(ctx, author: author, old_space: old_space, new_space: new_space) do
    ctx |> assert_feed_item_exists(author, "moved the project", "From #{old_space.name} to #{new_space.name}")
  end

  def assert_project_archived(ctx, author: author) do
    ctx |> assert_feed_item_exists(author, "archived this project", "")
  end

  def assert_project_retrospective_posted(ctx, author: author) do
    ctx |> assert_feed_item_exists(author, "closed this project and submitted a retrospective", "")
  end

  def assert_project_timeline_edited(ctx, author: author, messages: messages) do
    ctx
    |> UI.assert_text(Person.short_name(author))
    |> UI.assert_text("edited the timeline")
    |> then(fn ctx ->
      Enum.each(messages, fn message ->
        ctx |> UI.assert_text(message)
      end)

      ctx
    end)
  end

  #
  # Utility functions
  #

  defp assert_feed_item_exists(ctx, author, title, subtitle) do
    ctx
    |> UI.assert_text(Person.short_name(author))
    |> UI.assert_text(title)
    |> UI.assert_text(subtitle)
  end
end
