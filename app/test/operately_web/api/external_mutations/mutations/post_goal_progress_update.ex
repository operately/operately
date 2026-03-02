defmodule OperatelyWeb.Api.ExternalMutations.Mutations.PostGoalProgressUpdate do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "post_goal_progress_update"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  @impl true
  def inputs(ctx) do
    %{
      goal_id: Paths.goal_id(ctx.goal),
      status: "on_track",
      due_date: nil,
      checklist: [],
      content: rich_text_string("Updated content"),
      new_target_values: "[]"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.update.id
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
