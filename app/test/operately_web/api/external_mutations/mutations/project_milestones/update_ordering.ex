defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectMilestones.UpdateOrdering do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "project_milestones/update_ordering"

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
      ordering_state: [Paths.milestone_id(ctx.milestone)]
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.project.id
    refute Map.has_key?(response, :error)
  end
end
