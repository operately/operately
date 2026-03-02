defmodule OperatelyWeb.Api.ExternalMutations.Mutations.UpdateTheme do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "update_theme"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
  end

  @impl true
  def inputs(_) do
    %{
      theme: "system"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    refute Map.has_key?(response, :error)
  end
end
