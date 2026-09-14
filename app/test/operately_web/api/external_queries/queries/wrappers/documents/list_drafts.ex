defmodule OperatelyWeb.Api.ExternalQueries.Queries.Wrappers.Documents.ListDrafts do
  use Operately.Support.ExternalApi.QuerySpec

  alias OperatelyWeb.Api.ExternalQueries.Queries.ResourceHubs.ListDrafts

  @impl true
  def query_name, do: "documents/list_drafts"

  @impl true
  defdelegate setup(ctx), to: ListDrafts

  @impl true
  defdelegate inputs(ctx), to: ListDrafts

  @impl true
  defdelegate assert(response, ctx), to: ListDrafts
end
