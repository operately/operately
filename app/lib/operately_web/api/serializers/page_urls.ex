defmodule OperatelyWeb.Api.PageUrls do
  @moduledoc """
  Attaches canonical page URLs to serialized discovery results.

  The company is supplied explicitly by API handlers that guarantee page URLs.
  """

  alias Operately.ResourceHubs.Node
  alias OperatelyWeb.Api.Pageable
  alias OperatelyWeb.Paths

  def attach(serialized, _original, nil), do: serialized

  def attach(serialized, originals, company) when is_list(serialized) and is_list(originals) do
    Enum.zip_with(serialized, originals, &attach(&1, &2, company))
  end

  def attach(serialized, %Node{} = node, company) when is_map(serialized) do
    resource = Map.fetch!(node, node.type)
    Map.update!(serialized, node.type, &attach(&1, resource, company))
  end

  def attach(serialized, original, company) when is_map(serialized) do
    case Pageable.page_url(original, company) do
      {field, path} -> Map.put(serialized, field, Paths.to_url(path))
      nil -> serialized
    end
  end

  def attach(serialized, _original, _company), do: serialized
end
