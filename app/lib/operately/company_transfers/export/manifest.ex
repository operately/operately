defmodule Operately.CompanyTransfers.Export.Manifest do
  alias Operately.Repo

  def build(export_run, company, collected) do
    exported_at = DateTime.utc_now() |> DateTime.truncate(:second)

    %{
      "package_format_version" => 1,
      "slice" => "relational_minimal",
      "operately_version" => Operately.version(),
      "exported_at" => DateTime.to_iso8601(exported_at),
      "export_run_id" => export_run.id,
      "requested_by_id" => export_run.requested_by_id,
      "source_company" => %{
        "id" => company.id,
        "name" => company.name,
        "short_id" => company.short_id
      },
      "schema_migrations" => load_schema_migrations(),
      "tables_count" => collected.non_empty_tables_count,
      "rows_count" => collected.rows_count,
      "files_count" => 0,
      "table_names" => Enum.map(collected.tables, & &1["name"])
    }
  end

  def summary(manifest, collected) do
    %{
      "package_format_version" => manifest["package_format_version"],
      "slice" => manifest["slice"],
      "operately_version" => manifest["operately_version"],
      "source_company" => manifest["source_company"],
      "tables_count" => collected.non_empty_tables_count,
      "rows_count" => collected.rows_count,
      "files_count" => 0
    }
  end

  defp load_schema_migrations do
    case Repo.query("SELECT version FROM schema_migrations ORDER BY version", []) do
      {:ok, %{rows: rows}} -> Enum.map(rows, fn [version] -> version end)
      {:error, _reason} -> []
    end
  end
end
