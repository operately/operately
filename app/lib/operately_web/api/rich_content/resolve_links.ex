defmodule OperatelyWeb.Api.RichContent.ResolveLinks do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.RichContent.{LinkEnrichment, ResourceLinkResolver}

  inputs do
    field :urls, list_of(:string), null: false
  end

  outputs do
    field :links, list_of(:resolved_resource_link), null: false
  end

  def call(conn, %{urls: urls}) do
    with {:ok, person} <- find_me(conn),
         {:ok, company} <- find_company(conn),
         :ok <- validate_batch_size(urls) do
      links = LinkEnrichment.resolve_urls(urls, %{person: person, company: company, origin: OperatelyWeb.Endpoint.url()})
      {:ok, %{links: links}}
    else
      {:error, :bad_request, _} = error -> error
      _ -> {:error, :unauthorized}
    end
  end

  defp validate_batch_size(urls) do
    if length(urls) <= ResourceLinkResolver.max_unique_refs() do
      :ok
    else
      {:error, :bad_request, "At most 100 URLs can be resolved at once"}
    end
  end
end
