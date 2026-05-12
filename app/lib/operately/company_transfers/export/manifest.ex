defmodule Operately.CompanyTransfers.Export.Manifest do
  def build(export_run, company, collected, file_count) do
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
      "tables_count" => collected.non_empty_tables_count,
      "rows_count" => collected.rows_count,
      "files_count" => file_count,
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
      "files_count" => manifest["files_count"]
    }
  end
end
