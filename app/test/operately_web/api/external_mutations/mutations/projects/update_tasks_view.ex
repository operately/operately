defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Projects.UpdateTasksView do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "projects/update_tasks_view"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
  end

  @impl true
  def inputs(ctx) do
    %{
      project_id: Paths.project_id(ctx.project),
      tasks_view: "board"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.project.id
    assert response.project.tasks_view == "board"
    refute Map.has_key?(response, :error)
  end
end
