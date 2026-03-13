defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Spaces.DeleteMember do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "spaces/delete_member"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:member, :space)
  end

  @impl true
  def inputs(ctx) do
    %{
      group_id: Paths.space_id(ctx.space),
      member_id: Paths.person_id(ctx.member)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert is_map(response)
    refute Map.has_key?(response, :error)
  end
end
