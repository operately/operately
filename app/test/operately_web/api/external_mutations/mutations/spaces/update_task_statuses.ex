defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Spaces.UpdateTaskStatuses do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "spaces/update_task_statuses"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  @impl true
  def inputs(ctx) do
    %{
      space_id: Paths.space_id(ctx.space),
      task_statuses: [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "done", label: "Done", color: "green", index: 1, value: "done", closed: true}
      ]
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    refute Map.has_key?(response, :error)
  end
end
