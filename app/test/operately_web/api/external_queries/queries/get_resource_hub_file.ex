defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetResourceHubFile do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_file(:file, :hub)
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.file_id(ctx.file)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.file
    assert response.file.id == Paths.file_id(ctx.file)
  end
end
