defmodule Operately.CompanyTransfers.Export.Relational.CompanyOwnedRows do
  alias Operately.CompanyTransfers.Export.Relational.{OwnershipPaths, SchemaSnapshot, Sql}
  alias Operately.Repo

  @company_table "companies"

  def collect(%SchemaSnapshot{} = schema, company_id) when is_binary(company_id) do
    schema
    |> SchemaSnapshot.included_tables()
    |> Enum.reduce({:ok, %{}}, fn table, {:ok, acc} ->
      case fetch_owned_rows(table, company_id, schema) do
        {:ok, rows} -> {:ok, Map.put(acc, table, rows)}
        :skip -> {:ok, Map.put(acc, table, [])}
      end
    end)
  end

  defp fetch_owned_rows(@company_table, company_id, %SchemaSnapshot{columns: columns}) do
    {:ok, Sql.fetch_rows_by_column!(@company_table, "id", [company_id], Map.fetch!(columns, @company_table))}
  end

  defp fetch_owned_rows(table, company_id, %SchemaSnapshot{columns: columns} = schema) do
    case OwnershipPaths.find_paths_to_company(table, schema) do
      [] ->
        # Some included tables are not reachable through the minimal FK-based ownership walk.
        # They stay empty in the PR 4 slice and can gain explicit handling later.
        :skip

      paths ->
        query =
          paths
          |> Enum.map(&Sql.ownership_path_query(table, &1))
          |> Enum.join(" UNION ")

        rows =
          Repo.query!(query, [dump_company_id!(company_id)])
          |> Sql.result_rows()
          |> Sql.load_uuid_columns(Map.fetch!(columns, table))

        {:ok, rows}
    end
  end

  defp dump_company_id!(company_id) do
    case Ecto.UUID.dump(company_id) do
      {:ok, dumped} ->
        dumped

      :error ->
        raise ArgumentError, "Expected company_id to be a UUID, got #{inspect(company_id)}"
    end
  end
end
