defmodule OperatelyWeb.Api.ExternalMutations.Mutations.People.Update do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "people/update"

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
      timezone: "Etc/UTC",
      language: "es"
    }
  end

  @impl true
  def assert(response, ctx) do
    assert response.person.id
    assert Operately.Repo.reload!(ctx.creator).language == "es"
    refute Map.has_key?(response, :error)
  end
end
