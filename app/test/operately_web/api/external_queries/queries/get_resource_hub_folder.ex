defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetResourceHubFolder do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_folder(:folder, :hub)
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.folder_id(ctx.folder)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.folder
    assert response.folder.id == Paths.folder_id(ctx.folder)
  end
end
