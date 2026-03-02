defmodule OperatelyWeb.Api.ExternalMutations.Mutations.EditGoalProgressUpdate do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "edit_goal_progress_update"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_goal_update(:goal_update, :goal, :creator)
  end

  @impl true
  def inputs(ctx) do
    %{
      id: Paths.goal_update_id(ctx.goal_update),
      due_date: nil,
      status: "on_track",
      content: rich_text_string("Updated content"),
      new_target_values: "[]",
      checklist: []
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.update.id
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
