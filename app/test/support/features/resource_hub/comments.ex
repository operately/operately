defmodule Operately.Support.ResourceHub.Comments do
  alias Operately.Support.Features.ResourceHubSteps, as: Steps

  defmacro __using__(_opts) do
    quote do
      import Operately.Support.ResourceHub.Comments
    end
  end

  def comment_on_resource(ctx) do
    ctx
    |> Steps.set_page_reload_marker()
    |> Steps.leave_comment()
    |> Steps.leave_comment()
    |> Steps.navigate_back("Documents & Files")
    |> Steps.assert_comments_count(%{index: 0, count: "2"})
    |> Steps.assert_page_was_not_reloaded()
  end

  def leave_one_comment(ctx) do
    ctx
    |> Steps.leave_comment()
    |> Steps.assert_comment_present()
  end

  def delete_comment_on_resource(ctx) do
    ctx
    |> Steps.set_page_reload_marker()
    |> Steps.delete_comment()
    |> Steps.assert_comment_deleted()
    |> Steps.reopen_resource_from_list()
    |> Steps.assert_comment_deleted()
    |> Steps.assert_page_was_not_reloaded()
  end
end
