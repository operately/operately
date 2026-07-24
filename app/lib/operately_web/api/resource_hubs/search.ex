defmodule OperatelyWeb.Api.ResourceHubs.Search do
  @moduledoc """
  Searches indexed, visible content inside one resource hub.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.ResourceHub
  alias Operately.Search
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :resource_hub_id, :id, null: false
    field :query, :string, null: false
  end

  outputs do
    field :results, list_of(:search_result), null: false
  end

  def call(conn, inputs) do
    with {:ok, hub} <- ResourceHub.get(me(conn), id: inputs.resource_hub_id) do
      results = hub |> Search.search_resource_hub(inputs.query) |> Serializer.serialize()
      {:ok, %{results: results}}
    else
      {:error, :not_found} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end
end
