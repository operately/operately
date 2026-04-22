defmodule Operately.CompanyTransfers.Export.FileDiscovery do
  @moduledoc """
  Discovers which exported blob rows need real payload bytes and where blob
  references live in the exported package.

  Direct blob foreign keys are tracked explicitly. Blob nodes inside rich text
  are discovered generically by scanning schema-backed `:map` fields whose value
  is a top-level TipTap document.
  """

  alias Operately.CompanyTransfers.Schema.AppSchemas
  alias Operately.RichContent

  @direct_blob_fields %{
    "people" => ["avatar_blob_id"],
    "resource_files" => ["blob_id", "preview_blob_id"]
  }

  def discover(%{"tables" => tables}) when is_list(tables), do: discover(tables)

  def discover(tables) when is_list(tables) do
    rows_by_table = rows_by_table(tables)
    exported_blob_ids = exported_blob_ids(rows_by_table)

    direct_blob_references =
      rows_by_table
      |> discover_direct_blob_references()
      |> keep_exported_blob_references(exported_blob_ids)

    rich_text_blob_references =
      rows_by_table
      |> discover_rich_text_blob_references()
      |> keep_exported_blob_references(exported_blob_ids)

    referenced_blob_ids =
      direct_blob_references
      |> Enum.map(& &1.blob_id)
      |> Kernel.++(Enum.map(rich_text_blob_references, & &1.blob_id))
      |> MapSet.new()

    files =
      rows_by_table
      |> Map.get("blobs", [])
      |> Enum.filter(&MapSet.member?(referenced_blob_ids, &1["id"]))
      |> Enum.map(&build_file_entry/1)
      |> Enum.sort_by(&{&1["blob_id"], &1["path"]})

    %{
      files: files,
      direct_blob_references: Enum.sort_by(direct_blob_references, &{&1.table, &1.row_id, &1.column, &1.blob_id}),
      rich_text_blob_references: Enum.sort_by(rich_text_blob_references, &{&1.table, &1.row_id, &1.column, &1.blob_id})
    }
  end

  defp rows_by_table(tables) do
    Map.new(tables, fn table ->
      {table["name"], Map.get(table, "rows", [])}
    end)
  end

  defp exported_blob_ids(rows_by_table) do
    rows_by_table
    |> Map.get("blobs", [])
    |> Enum.map(& &1["id"])
    |> MapSet.new()
  end

  defp discover_direct_blob_references(rows_by_table) do
    Enum.flat_map(@direct_blob_fields, fn {table, columns} ->
      rows_by_table
      |> Map.get(table, [])
      |> Enum.flat_map(fn row ->
        Enum.flat_map(columns, fn column ->
          case Map.get(row, column) do
            blob_id when is_binary(blob_id) ->
              [%{table: table, row_id: row["id"], column: column, blob_id: blob_id}]

            _ ->
              []
          end
        end)
      end)
    end)
  end

  defp discover_rich_text_blob_references(rows_by_table) do
    Enum.flat_map(rows_by_table, fn {table, rows} ->
      map_fields = AppSchemas.map_fields_for_table(table)

      Enum.flat_map(rows, fn row ->
        Enum.flat_map(map_fields, fn field ->
          case Map.get(row, field) do
            value when is_map(value) ->
              if RichContent.tiptap_document?(value) do
                value
                |> RichContent.Blob.find_ids()
                |> Enum.map(fn blob_id -> %{table: table, row_id: row["id"], column: field, blob_id: blob_id} end)
              else
                []
              end

            _ ->
              []
          end
        end)
      end)
    end)
  end

  defp keep_exported_blob_references(references, exported_blob_ids) do
    Enum.filter(references, &MapSet.member?(exported_blob_ids, &1.blob_id))
  end

  defp build_file_entry(blob_row) do
    filename = blob_row["filename"] || blob_row["id"]

    %{
      "blob_id" => blob_row["id"],
      "path" => Path.join(["blobs", blob_row["id"], filename])
    }
  end
end
