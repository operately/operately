defmodule OperatelyEE.AdminApi.Queries.GetSearchIndexStatus do
  use TurboConnect.Query

  alias Operately.Search.MaintenanceRuns
  alias OperatelyWeb.Api.Serializer

  inputs do
  end

  outputs do
    field :sources, list_of(:search_index_source_status)
  end

  def call(_conn, _inputs) do
    with {:ok, source_statuses} <- MaintenanceRuns.list_source_statuses() do
      {:ok, %{sources: Enum.map(source_statuses, &serialize_source_status/1)}}
    else
      _error -> {:error, :internal_server_error}
    end
  end

  defp serialize_source_status(%{source_type: source_type, latest_run: latest_run}) do
    %{
      source_type: String.to_existing_atom(source_type),
      latest_run: Serializer.serialize(latest_run)
    }
  end
end
