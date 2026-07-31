defmodule OperatelyEE.AdminApi.Mutations.StartSearchIndexMaintenance do
  use TurboConnect.Mutation

  alias Operately.Search.MaintenanceRuns

  inputs do
    field :kind, :search_index_maintenance_kind
    field? :source_type, :search_index_source_type
  end

  outputs do
    field :started_source_types, list_of(:search_index_source_type)
    field :already_running_source_types, list_of(:search_index_source_type)
  end

  def call(_conn, inputs) do
    target = source_type_target(inputs[:source_type])

    case MaintenanceRuns.start(inputs.kind, target) do
      {:ok, result} ->
        {:ok, serialize_result(result)}

      {:error, :already_running} ->
        {:error, :bad_request, "Search index maintenance is already running for #{target}"}

      {:error, :unknown_source_type} ->
        {:error, :bad_request, "Unknown search source type"}

      {:error, :unknown_maintenance_kind} ->
        {:error, :bad_request, "Unknown search maintenance kind"}

      _error ->
        {:error, :internal_server_error}
    end
  end

  defp source_type_target(nil), do: :all
  defp source_type_target(source_type), do: Atom.to_string(source_type)

  defp serialize_result(result) do
    %{
      started_source_types: Enum.map(result.started_source_types, &String.to_existing_atom/1),
      already_running_source_types: Enum.map(result.already_running_source_types, &String.to_existing_atom/1)
    }
  end
end
