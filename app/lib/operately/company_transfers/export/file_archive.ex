defmodule Operately.CompanyTransfers.Export.FileArchive do
  @moduledoc """
  Builds the export ZIP for discovered blob payloads.

  The package already knows which blob rows are relevant and which package paths
  they should occupy. This module downloads those blob payloads into a staging
  area and creates the ZIP from the staged files.
  """

  alias Operately.Blobs
  alias Operately.CompanyTransfers.BlobIO
  alias Operately.CompanyTransfers.Package.Archive

  @placeholder_message "No files are included in this export yet.\n"

  def create!(zip_path, []) do
    Archive.create!(zip_path, [%{path: "README.txt", content: @placeholder_message}])
  end

  def create!(zip_path, files) when is_list(files) do
    staging_root = Path.join(Path.dirname(zip_path), ".blob-export-#{System.unique_integer([:positive])}")

    try do
      entries =
        Enum.flat_map(files, fn %{"blob_id" => blob_id, "path" => relative_path} ->
          blob = Blobs.get_blob!(blob_id)
          source_path = Path.join(staging_root, relative_path)
          File.mkdir_p!(Path.dirname(source_path))

          case BlobIO.download_to_path(blob, source_path) do
            :ok ->
              [%{path: relative_path, source_path: source_path}]

            {:error, _reason} ->
              []
          end
        end)

      Archive.create!(zip_path, entries)
    after
      File.rm_rf!(staging_root)
    end
  end
end
