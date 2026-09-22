defmodule OperatelyWeb.Api.RichContent.ResolveLinks do
  @moduledoc """
  Resolves titles for Operately resource links in authenticated rich-text read mode.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.RichContent.ResourceLinkResolver

  inputs do
    field :types, list_of(:resource_link_type), null: false
    field :ids, list_of(:string), null: false
  end

  outputs do
    field :links, list_of(:resource_link), null: false
  end

  def call(conn, inputs) do
    links =
      conn
      |> me()
      |> ResourceLinkResolver.resolve(company(conn), resource_refs(inputs))

    {:ok, %{links: links}}
  end

  defp resource_refs(inputs) do
    types = inputs[:types] || []
    ids = inputs[:ids] || []

    types
    |> Enum.zip(ids)
    |> Enum.map(fn {type, id} -> %{type: type, id: id} end)
  end
end
