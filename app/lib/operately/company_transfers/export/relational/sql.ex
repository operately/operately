defmodule Operately.CompanyTransfers.Export.Relational.Sql do
  @moduledoc """
  Low-level SQL helpers used by relational export.

  Public functions:
  - `ownership_path_query/2` builds the company-ownership query for a table/path pair
  - `fetch_rows_by_column!/4` fetches rows by a specific column and preserves stable ordering
  - `fetch_rows_by_type_and_ids!/6` fetches rows by a type/id pair and preserves stable ordering
  - `fetch_rows_by_json_text_field!/5` fetches rows by a JSON text field and preserves stable ordering
  - `result_rows/1` converts raw query results into `%{"column" => value}` maps
  """

  alias Operately.Repo

  @identifier_regex ~r/^[a-z_][a-z0-9_]*$/i

  @doc """
  Builds the SQL query used to prove that a row belongs to a company.

  `path` is an ordered list of FK edges from the starting table back toward
  `companies`, for example:

      [
        %{from_table: "tasks", to_table: "projects", column: "project_id", references_column: "id"},
        %{from_table: "projects", to_table: "companies", column: "company_id", references_column: "id"}
      ]
  """
  def ownership_path_query(table, []) do
    validate_identifier!(table, "table")
    "SELECT t0.* FROM #{quote_identifier(table)} t0 WHERE t0.\"id\" = $1"
  end

  def ownership_path_query(table, path) do
    validate_identifier!(table, "table")
    path = Enum.map(path, &normalize_path_edge!/1)

    # `t0` is always the exported table. Each edge in `path` adds one parent join.
    {joins, final_alias} =
      Enum.with_index(path, 1)
      |> Enum.reduce({[], "t0"}, fn {edge, index}, {join_acc, current_alias} ->
        next_alias = "t#{index}"

        # Join from the current table alias to the next parent table in the ownership path.
        join =
          "JOIN #{quote_identifier(edge.to_table)} #{next_alias} ON " <>
            "#{current_alias}.#{quote_identifier(edge.column)} = #{next_alias}.#{quote_identifier(edge.references_column)}"

        {join_acc ++ [join], next_alias}
      end)

    [
      "SELECT t0.*",
      "FROM #{quote_identifier(table)} t0",
      Enum.join(joins, " "),
      # The last joined alias must be the owning company row we are exporting.
      "WHERE #{final_alias}.\"id\" = $1"
    ]
    |> Enum.reject(&(&1 == ""))
    |> Enum.join(" ")
  end

  @doc """
  Fetches rows where `column` matches any of the given `values`.

  The returned rows are sorted by the table primary key so export output remains
  deterministic across runs.
  """
  def fetch_rows_by_column!(_table, _column, [], _columns), do: []

  def fetch_rows_by_column!(table, column, values, columns) do
    quoted_table = quote_identifier(table)
    quoted_column = quote_identifier(column)
    placeholders = Enum.map_join(1..length(values), ", ", &"$#{&1}")
    column_type = lookup_column_type(columns, column)
    params = dump_query_values(values, column_type, column)
    query = "SELECT * FROM #{quoted_table} WHERE #{quoted_column} IN (#{placeholders})"

    Repo.query!(query, params)
    |> result_rows()
    |> load_uuid_columns(columns)
    # Keep output stable even when PostgreSQL returns `IN (...)` rows in a different order.
    |> Enum.sort_by(&Map.get(&1, primary_key(columns)))
  end

  def fetch_rows_by_type_and_ids!(_table, _type_column, _type_value, _id_column, [], _columns), do: []

  def fetch_rows_by_type_and_ids!(table, type_column, type_value, id_column, values, columns) do
    quoted_table = quote_identifier(table)
    quoted_type_column = quote_identifier(type_column)
    quoted_id_column = quote_identifier(id_column)
    placeholders = Enum.map_join(2..(length(values) + 1), ", ", &"$#{&1}")
    id_column_type = lookup_column_type(columns, id_column)
    params = [type_value | dump_query_values(values, id_column_type, id_column)]
    query = "SELECT * FROM #{quoted_table} WHERE #{quoted_type_column} = $1 AND #{quoted_id_column} IN (#{placeholders})"

    Repo.query!(query, params)
    |> result_rows()
    |> load_uuid_columns(columns)
    |> Enum.sort_by(&Map.get(&1, primary_key(columns)))
  end

  def fetch_rows_by_json_text_field!(_table, _json_column, _json_key, [], _columns), do: []

  def fetch_rows_by_json_text_field!(table, json_column, json_key, values, columns) do
    quoted_table = quote_identifier(table)
    quoted_json_column = quote_identifier(json_column)
    placeholders = Enum.map_join(2..(length(values) + 1), ", ", &"$#{&1}")
    query = "SELECT * FROM #{quoted_table} WHERE #{quoted_json_column} ->> $1 IN (#{placeholders})"

    Repo.query!(query, [json_key | values])
    |> result_rows()
    |> load_uuid_columns(columns)
    |> Enum.sort_by(&Map.get(&1, primary_key(columns)))
  end

  @doc """
  Converts an `%Ecto.Adapters.SQL.Result{}` into row maps keyed by column name.
  """
  def result_rows(%{columns: columns, rows: rows}) do
    # Pair each result row with the column list to get `%{"column" => value}` maps.
    Enum.map(rows, fn row -> Enum.zip(columns, row) |> Map.new() end)
  end

  defp lookup_column_type(columns, column_name) do
    columns
    |> Enum.find(&(column_name(&1) == column_name))
    |> case do
      nil -> nil
      column -> column_type(column)
    end
  end

  defp dump_query_values(values, "uuid", _column) do
    Enum.map(values, &dump_uuid!/1)
  end

  defp dump_query_values(values, nil, column) do
    if uuid_like_column?(column), do: maybe_dump_uuid_values(values), else: values
  end

  defp dump_query_values(values, _type, _column), do: values

  defp maybe_dump_uuid_values(values) do
    if Enum.all?(values, &uuid_compatible?/1) do
      Enum.map(values, &dump_uuid!/1)
    else
      values
    end
  end

  defp dump_uuid!(value) when is_binary(value) and byte_size(value) == 16 do
    value
  end

  defp dump_uuid!(value) do
    case Ecto.UUID.dump(value) do
      {:ok, dumped} ->
        dumped

      :error ->
        raise ArgumentError, "Expected UUID-compatible value, got #{inspect(value)}"
    end
  end

  defp uuid_compatible?(value) when is_binary(value) and byte_size(value) == 16 do
    true
  end

  defp uuid_compatible?(value) do
    match?({:ok, _dumped}, Ecto.UUID.dump(value))
  end

  defp uuid_like_column?(column) when is_binary(column) do
    column == "id" or String.ends_with?(column, "_id")
  end

  def load_uuid_columns(rows, columns) do
    uuid_columns =
      columns
      |> Enum.filter(&(column_type(&1) == "uuid"))
      |> Enum.map(&column_name/1)
      |> MapSet.new()

    if MapSet.size(uuid_columns) == 0 do
      rows
    else
      Enum.map(rows, fn row ->
        Map.new(row, fn {key, value} ->
          if MapSet.member?(uuid_columns, key) and is_binary(value) do
            {key, load_uuid!(value)}
          else
            {key, value}
          end
        end)
      end)
    end
  end

  defp load_uuid!(value) when is_binary(value) do
    case Ecto.UUID.load(value) do
      {:ok, loaded} ->
        loaded

      :error ->
        value
    end
  end

  defp primary_key(columns) do
    columns
    |> Enum.find_value(fn column ->
      if column_name(column) == "id", do: column_name(column)
    end)
    |> case do
      nil -> raise "Expected table to have an id column"
      name -> name
    end
  end

  defp column_name(column) do
    Map.get(column, :name) || Map.get(column, "name")
  end

  defp column_type(column) do
    Map.get(column, :type) || Map.get(column, "type")
  end

  defp normalize_path_edge!(%{to_table: to_table, column: column, references_column: references_column} = edge) do
    validate_identifier!(to_table, "path.to_table")
    validate_identifier!(column, "path.column")
    validate_identifier!(references_column, "path.references_column")
    edge
  end

  defp normalize_path_edge!(edge) do
    raise ArgumentError,
          "Invalid ownership path edge: expected %{to_table: ..., column: ..., references_column: ...}, got #{inspect(edge)}"
  end

  defp quote_identifier(identifier) do
    validate_identifier!(identifier, "identifier")

    "\"#{identifier}\""
  end

  defp validate_identifier!(identifier, label) when is_binary(identifier) do
    unless Regex.match?(@identifier_regex, identifier) do
      raise ArgumentError, "Unsafe SQL #{label}: #{inspect(identifier)}"
    end

    identifier
  end

  defp validate_identifier!(identifier, label) do
    raise ArgumentError, "Unsafe SQL #{label}: #{inspect(identifier)}"
  end
end
