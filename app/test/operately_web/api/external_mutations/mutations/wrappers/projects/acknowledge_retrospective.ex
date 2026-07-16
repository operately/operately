defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Wrappers.Projects.AcknowledgeRetrospective do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "projects/acknowledge_retrospective"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:person, :space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_retrospective(:project_retrospective, :project, :person)
  end

  @impl true
  def inputs(ctx) do
    %{
      project_id: Paths.project_id(ctx.project)
    }
  end

  @impl true
  def assert(response, ctx) do
    assert response.retrospective.id == Paths.project_retrospective_id(ctx.project_retrospective)
    refute Map.has_key?(response, :error)
  end
end
