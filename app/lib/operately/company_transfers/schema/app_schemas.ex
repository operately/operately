defmodule Operately.CompanyTransfers.Schema.AppSchemas do
  @moduledoc """
  Looks up current application Ecto schemas so company transfer code can inspect table-backed field metadata.
  """

  @table_schema_map_key {__MODULE__, :table_schema_map}
  @table_schema_map_metadata_key {__MODULE__, :table_schema_map_metadata}

  @doc """
  Returns the persisted DB column names for `:map` fields on the current Ecto schema for the given table.
  """
  def map_fields_for_table(table_name) when is_binary(table_name) do
    case schema_for_table(table_name) do
      nil ->
        []

      module ->
        module.__schema__(:fields)
        |> Enum.filter(&(module.__schema__(:type, &1) == :map))
        |> Enum.map(&module.__schema__(:field_source, &1))
        |> Enum.reject(&is_nil/1)
        |> Enum.map(&to_string/1)
        |> Enum.sort()
    end
  end

  @doc """
  Returns the current application schema module for a DB table.
  """
  def schema_for_table(table_name) when is_binary(table_name) do
    Map.get(table_schema_map(), table_name)
  end

  @doc """
  Returns a DB column name to Ecto field atom map for persisted fields on the table schema.
  """
  def persisted_fields_for_table(table_name) when is_binary(table_name) do
    case schema_for_table(table_name) do
      nil -> %{}
      module -> persisted_fields(module)
    end
  end

  @doc """
  Returns a diagnostic snapshot for table-to-schema resolution failures.
  """
  def unknown_table_diagnostics(table_name) when is_binary(table_name) do
    map = table_schema_map()

    %{
      table: table_name,
      node: node(),
      operately_version: app_version(),
      cached_schema_module: Map.get(map, table_name),
      cached_map_contains_table: Map.has_key?(map, table_name),
      cached_map_size: map_size(map),
      cached_tables_sample: map |> Map.keys() |> Enum.sort() |> Enum.take(25),
      cache_metadata: table_schema_map_metadata(),
      operately_modules_count: operately_modules() |> length(),
      application_schema_candidates: schema_candidates(operately_modules(), table_name),
      loaded_schema_candidates: schema_candidates(loaded_modules(), table_name)
    }
  end

  defp table_schema_map do
    case :persistent_term.get(@table_schema_map_key, nil) do
      nil ->
        {map, metadata} = build_table_schema_map()

        :persistent_term.put(@table_schema_map_key, map)
        :persistent_term.put(@table_schema_map_metadata_key, metadata)
        map

      map ->
        map
    end
  end

  defp build_table_schema_map do
    modules = operately_modules()
    schema_modules = Enum.filter(modules, &schema_module?/1)

    map =
      schema_modules
      |> Map.new(fn module -> {schema_table(module), module} end)

    metadata = %{
      built_at: DateTime.utc_now() |> DateTime.truncate(:second),
      node: node(),
      operately_version: app_version(),
      operately_modules_count: length(modules),
      schema_modules_count: length(schema_modules),
      table_count: map_size(map)
    }

    {map, metadata}
  end

  defp table_schema_map_metadata do
    :persistent_term.get(@table_schema_map_metadata_key, nil)
  end

  defp persisted_fields(module) do
    (module.__schema__(:fields) ++ module.__schema__(:embeds))
    |> Enum.reject(&(&1 in module.__schema__(:virtual_fields)))
    |> Map.new(fn field -> {module.__schema__(:field_source, field) |> to_string(), field} end)
  end

  defp operately_modules do
    case :application.get_key(:operately, :modules) do
      {:ok, modules} -> modules
      :undefined -> []
    end
  end

  defp loaded_modules do
    :code.all_loaded() |> Enum.map(&elem(&1, 0))
  end

  defp schema_module?(module) do
    Code.ensure_loaded?(module) and function_exported?(module, :__schema__, 1) and schema_source_path?(module) and current_app_schema?(module)
  end

  defp schema_candidates(modules, table_name) do
    modules
    |> Enum.uniq()
    |> Enum.flat_map(fn module ->
      with true <- Code.ensure_loaded?(module),
           true <- function_exported?(module, :__schema__, 1),
           ^table_name <- schema_table(module) do
        [
          %{
            module: module,
            code_path: format_code_path(:code.which(module)),
            source_path: source_path(module),
            passes_source_path_filter: schema_source_path?(module),
            passes_current_app_schema_filter: current_app_schema?(module)
          }
        ]
      else
        _ -> []
      end
    end)
    |> Enum.sort_by(&inspect(&1.module))
  end

  defp schema_source_path?(module) do
    source = source_path(module)

    source != nil and
      (String.contains?(source, "/app/lib/") or String.contains?(source, "/app/ee/lib/")) and
      not String.contains?(source, "/app/lib/operately/data/")
  end

  defp current_app_schema?(module) do
    table = schema_table(module)
    table != nil and table != "my_schema"
  end

  defp schema_table(module) do
    module.__schema__(:source)
  rescue
    _error -> nil
  end

  defp source_path(module) do
    case module.module_info(:compile)[:source] do
      source when is_list(source) -> List.to_string(source)
      source when is_binary(source) -> source
      _ -> nil
    end
  end

  defp format_code_path(path) when is_list(path), do: List.to_string(path)
  defp format_code_path(path), do: path

  defp app_version do
    case Application.spec(:operately, :vsn) do
      version when is_list(version) -> List.to_string(version)
      version -> version
    end
  end
end
