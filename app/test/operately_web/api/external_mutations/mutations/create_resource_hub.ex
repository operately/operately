defmodule OperatelyWeb.Api.ExternalMutations.Mutations.CreateResourceHub do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding

  @impl true
  def mutation_name, do: "create_resource_hub"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  @impl true
  def inputs(ctx) do
    %{
      space_id: Paths.space_id(ctx.space),
      name: "Updated Name",
      description: rich_text_string("Updated description"),
      anonymous_access_level: Binding.no_access(),
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access()
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.resource_hub.id
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
