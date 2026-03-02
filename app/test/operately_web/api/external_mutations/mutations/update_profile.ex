defmodule OperatelyWeb.Api.ExternalMutations.Mutations.UpdateProfile do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "update_profile"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()

  end

  @impl true
  def inputs(ctx) do
    %{
      id: Paths.person_id(ctx.creator),
      full_name: "External Member",
      title: "Updated Title",
      timezone: "Etc/UTC"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.person.id
    refute Map.has_key?(response, :error)
  end
end
