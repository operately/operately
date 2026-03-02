defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectMilestones.UpdateTitle do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "project_milestones/update_title"

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
      milestone_id: Paths.milestone_id(ctx.milestone),
      title: "Updated Title"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.milestone.id
    refute Map.has_key?(response, :error)
  end
end
