defmodule OperatelyWeb.Api.ExternalQueries.Queries.Wrappers.Documents.Search do
  use Operately.Support.ExternalApi.QuerySpec

  alias OperatelyWeb.Api.ExternalQueries.Queries.ResourceHubs

  @impl true
  def query_name, do: "documents/search"

  @impl true
  defdelegate setup(ctx), to: ResourceHubs.Search

  @impl true
  defdelegate inputs(ctx), to: ResourceHubs.Search

  @impl true
  defdelegate assert(response, ctx), to: ResourceHubs.Search
end
