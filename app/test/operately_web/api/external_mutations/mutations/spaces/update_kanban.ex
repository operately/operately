defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Spaces.UpdateKanban do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "spaces/update_kanban"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.create_space_task(:space_task, :space)
  end

  @impl true
  def inputs(ctx) do
    ctx = Factory.log_in_person(ctx, :creator)

    status_input =
      Enum.find(ctx.space.task_statuses || [], fn s -> s.value == "done" end)
      |> then(fn status ->
        status
        |> Map.from_struct()
        |> Map.put(:color, to_string(status.color))
      end)

    kanban_state = %{
      pending: [],
      in_progress: [],
      done: [Paths.task_id(ctx.space_task)],
      canceled: []
    }

    %{
      space_id: Paths.space_id(ctx.space),
      task_id: Paths.task_id(ctx.space_task),
      status: status_input,
      kanban_state: Jason.encode!(kanban_state)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.task.id
    assert response.task.status.value == "done"
    refute Map.has_key?(response, :error)
  end
end
