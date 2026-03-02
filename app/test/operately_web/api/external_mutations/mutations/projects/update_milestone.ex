defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Projects.UpdateMilestone do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "projects/update_milestone"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
  end

  @impl true
  def inputs(ctx) do
    %{
      project_id: Paths.project_id(ctx.project),
      milestone_id: Paths.milestone_id(ctx.milestone),
      name: "Updated Name",
      due_date: nil
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert is_map(response)
    refute Map.has_key?(response, :error)
  end
end
