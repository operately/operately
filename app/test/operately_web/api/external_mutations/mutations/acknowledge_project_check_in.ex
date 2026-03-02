defmodule OperatelyWeb.Api.ExternalMutations.Mutations.AcknowledgeProjectCheckIn do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "acknowledge_project_check_in"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:person, :space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_check_in(:project_check_in, :project, :person)
  end

  @impl true
  def inputs(ctx) do
    %{
      id: Paths.project_check_in_id(ctx.project_check_in)
    }
  end

  @impl true
  def assert(response, ctx) do
    assert response.check_in.id == Paths.project_check_in_id(ctx.project_check_in)
    refute Map.has_key?(response, :error)
  end
end
