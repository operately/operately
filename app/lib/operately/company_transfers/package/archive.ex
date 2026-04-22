defmodule Operately.CompanyTransfers.Package.Archive do
  def create!(zip_path, entries \\ []) when is_binary(zip_path) and is_list(entries) do
    File.mkdir_p!(Path.dirname(zip_path))

    staging_root = Path.join(Path.dirname(zip_path), ".archive-#{System.unique_integer([:positive])}")

    try do
      staged_paths =
        entries
        |> stage_entries!(staging_root)
        |> Enum.map(&String.to_charlist/1)

      case :zip.create(String.to_charlist(zip_path), staged_paths, cwd: String.to_charlist(staging_root)) do
        {:ok, _zip_file} ->
          zip_path

        {:error, reason} ->
          raise "Failed to create zip archive #{zip_path}: #{inspect(reason)}"
      end
    after
      File.rm_rf!(staging_root)
    end
  end

  def extract!(zip_path, destination_path) when is_binary(zip_path) and is_binary(destination_path) do
    File.mkdir_p!(destination_path)

    case :zip.extract(String.to_charlist(zip_path), cwd: String.to_charlist(destination_path)) do
      {:ok, files} ->
        Enum.map(files, &List.to_string/1)

      {:error, reason} ->
        raise "Failed to extract zip archive #{zip_path}: #{inspect(reason)}"
    end
  end

  defp stage_entries!(entries, staging_root) do
    File.rm_rf!(staging_root)
    File.mkdir_p!(staging_root)

    Enum.map(entries, fn
      {path, content} when is_binary(path) and is_binary(content) ->
        write_entry!(staging_root, path, content)

      %{path: path, content: content} when is_binary(path) and is_binary(content) ->
        write_entry!(staging_root, path, content)

      %{path: path, source_path: source_path} when is_binary(path) and is_binary(source_path) ->
        copy_entry!(staging_root, path, source_path)
    end)
  end

  defp write_entry!(staging_root, relative_path, content) do
    staged_path = Path.join(staging_root, relative_path)
    File.mkdir_p!(Path.dirname(staged_path))
    File.write!(staged_path, content)
    relative_path
  end

  defp copy_entry!(staging_root, relative_path, source_path) do
    staged_path = Path.join(staging_root, relative_path)
    File.mkdir_p!(Path.dirname(staged_path))
    File.cp!(source_path, staged_path)
    relative_path
  end
end
