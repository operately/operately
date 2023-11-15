defmodule Operately.Support.Features.ProjectFeedSteps do
  alias Operately.Support.Features.UI
  alias Operately.People.Person

  def assert_project_moved(ctx, author: author, old_space: old_space, new_space: new_space) do
    ctx |> assert_feed_item_exists(author, "moved the project", "From #{old_space.name} to #{new_space.name}")
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
