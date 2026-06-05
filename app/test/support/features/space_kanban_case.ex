defmodule Operately.Support.Features.SpaceKanbanCase do
  defmacro __using__(_) do
    quote do
      @moduletag login_as: :creator

      alias Operately.Support.Features.SpaceKanbanSteps, as: Steps
      alias Operately.Support.Time

      setup ctx do
        ctx =
          ctx
          |> Operately.Support.Factory.setup()
          |> Operately.Support.Factory.add_space(:space, name: "Kanban Space")
          |> Operately.Support.Factory.add_space(:destination_space, name: "Destination Space")
          |> Operately.Support.Factory.enable_space_tool(:destination_space, :tasks)
          |> Operately.Support.Factory.add_project(:destination_project, :destination_space, name: "Destination Project")
          |> Operately.Support.Factory.create_space_task(:task, :space, name: "First Task")
          |> Operately.Support.Factory.create_space_task(:second_task, :space, name: "Second Task")
          |> Operately.Support.Factory.add_space_member(:teammate, :space, name: "Taylor Teammate")
          |> Operately.Support.Features.UI.login_based_on_tag()

        status_values = Enum.map(ctx.space.task_statuses, & &1.value)

        {:ok, Map.put(ctx, :status_values, status_values)}
      end
    end
  end
end
