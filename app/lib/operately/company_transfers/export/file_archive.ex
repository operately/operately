defmodule Operately.CompanyTransfers.Export.FileArchive do
  @moduledoc """
  Builds the export ZIP package with `data.json` and discovered blob payloads.

  The package already knows which blob rows are relevant and which package paths
  they should occupy. This module downloads those blob payloads into a staging
  area and creates the final ZIP structure:

      operately.zip
      ├── data.json
      └── files/...
  """

  require Logger

  alias Operately.Blobs
  alias Operately.CompanyTransfers.BlobIO
  alias Operately.CompanyTransfers.Package.Archive

  def create!(zip_path, json_path, files) when is_binary(zip_path) and is_binary(json_path) and is_list(files) do
    staging_root = Path.join(Path.dirname(zip_path), ".blob-export-#{System.unique_integer([:positive])}")

    try do
      entries =
        [%{path: "data.json", source_path: json_path}] ++
          Enum.flat_map(files, fn %{"blob_id" => blob_id, "path" => relative_path} ->
            blob = Blobs.get_blob!(blob_id)
            source_path = Path.join(staging_root, relative_path)
            File.mkdir_p!(Path.dirname(source_path))

            case BlobIO.download_to_path(blob, source_path) do
              :ok ->
                [%{path: archive_path(relative_path), source_path: source_path}]

              {:error, reason} ->
                Logger.warning("Skipping blob #{blob_id} during export: storage file unavailable (#{inspect(reason)})")
                []
            end
          end)

      Archive.create!(zip_path, entries)
    after
      File.rm_rf!(staging_root)
    end
  end

  defp archive_path(relative_path) do
    Path.join("files", relative_path)
  end
end
