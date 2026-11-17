defmodule OperatelyWeb.Api.ExternalQueries.Queries.Documents.ListHubs do
  use Operately.Support.ExternalApi.QuerySpec

  alias OperatelyWeb.Api.ExternalQueries.Queries.ResourceHubs.List

  @impl true
  def query_name, do: "documents/list_hubs"

  @impl true
  defdelegate setup(ctx), to: List

  @impl true
  defdelegate inputs(ctx), to: List

  @impl true
  defdelegate assert(response, ctx), to: List
end
