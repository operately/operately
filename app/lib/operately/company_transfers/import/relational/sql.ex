defmodule Operately.CompanyTransfers.Import.Relational.Sql do
  @moduledoc """
  Low-level SQL helpers for dynamic relational import.

  Rows are inserted and updated through `jsonb_populate_record`, which lets PostgreSQL
  cast JSON values into the destination table's real column types.
  """

  alias Operately.Repo

  @identifier_regex ~r/^[a-z_][a-z0-9_]*$/i

  def insert_row!(table, columns, row) when is_binary(table) and is_list(columns) and is_map(row) do
    validate_identifiers!([table | columns])
    validate_columns!(columns)

    quoted_table = quoted_table(table)
    columns_sql = Enum.map_join(columns, ", ", &quote_identifier/1)

    query = """
    INSERT INTO #{quoted_table} (#{columns_sql})
    SELECT #{columns_sql}
    FROM jsonb_populate_record(NULL::#{quoted_table}, $1::jsonb)
    """

    Repo.query!(query, [row])
  end

  def update_row!(table, columns, row) when is_binary(table) and is_list(columns) and is_map(row) do
    validate_identifiers!([table | columns])
    validate_columns!(columns)
    validate_update_row!(row)

    quoted_table = quoted_table(table)

    assignments_sql =
      Enum.map_join(columns, ", ", fn column ->
        quoted = quote_identifier(column)
        "#{quoted} = source.#{quoted}"
      end)

    query = """
    UPDATE #{quoted_table} AS target
    SET #{assignments_sql}
    FROM jsonb_populate_record(NULL::#{quoted_table}, $1::jsonb) AS source
    WHERE target.id = source.id
    """

    Repo.query!(query, [row])
  end

  defp validate_identifiers!(identifiers) do
    Enum.each(identifiers, fn identifier ->
      unless is_binary(identifier) and Regex.match?(@identifier_regex, identifier) do
        raise ArgumentError, "Unsafe SQL identifier: #{inspect(identifier)}"
      end
    end)
  end

  defp validate_columns!([]) do
    raise ArgumentError, "Expected at least one SQL column"
  end

  defp validate_columns!(columns) when is_list(columns), do: columns

  defp validate_update_row!(%{"id" => id}) when is_binary(id), do: :ok

  defp validate_update_row!(_row) do
    raise ArgumentError, ~s(update_row! requires row["id"] to be a UUID string)
  end

  defp quoted_table(table), do: "public." <> quote_identifier(table)
  defp quote_identifier(identifier), do: ~s("#{identifier}")
end
