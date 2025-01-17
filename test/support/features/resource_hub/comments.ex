defmodule Operately.Support.ResourceHub.Comments do
  alias Operately.Support.Features.ResourceHubSteps, as: Steps

  defmacro __using__(_opts) do
    quote do
      import Operately.Support.ResourceHub.Comments
    end
  end

  def comment_on_resource(ctx) do
    ctx
    |> Steps.leave_comment()
    |> Steps.leave_comment()
    |> Steps.navigate_back("Documents & Files")
    |> Steps.assert_comments_count(%{index: 0, count: "2"})
  end
end
