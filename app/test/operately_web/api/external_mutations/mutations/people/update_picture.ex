defmodule OperatelyWeb.Api.ExternalMutations.Mutations.People.UpdatePicture do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "people/update_picture"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()

  end

  @impl true
  def inputs(ctx) do
    %{
      person_id: Paths.person_id(ctx.creator)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.person.id
    refute Map.has_key?(response, :error)
  end
end
