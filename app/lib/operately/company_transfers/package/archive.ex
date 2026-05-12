defmodule Operately.CompanyTransfers.Package.Archive do
  alias Operately.CompanyTransfers.Package.Limits

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
    extract!(zip_path, destination_path, :all)
  end

  def extract!(zip_path, destination_path, allowed_paths) when is_binary(zip_path) and is_binary(destination_path) do
    File.mkdir_p!(destination_path)
    validate_zip_entries!(zip_path, allowed_paths)

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
    relative_path = normalize_relative_path!(relative_path)
    staged_path = Path.join(staging_root, relative_path)
    File.mkdir_p!(Path.dirname(staged_path))
    File.write!(staged_path, content)
    relative_path
  end

  defp copy_entry!(staging_root, relative_path, source_path) do
    relative_path = normalize_relative_path!(relative_path)
    staged_path = Path.join(staging_root, relative_path)
    File.mkdir_p!(Path.dirname(staged_path))
    File.cp!(source_path, staged_path)
    relative_path
  end

  defp normalize_relative_path!(relative_path) when is_binary(relative_path) do
    segments = Path.split(relative_path)

    cond do
      relative_path == "" ->
        raise ArgumentError, "Archive entry path must not be empty"

      Path.type(relative_path) == :absolute ->
        raise ArgumentError, "Archive entry path must be relative: #{inspect(relative_path)}"

      Enum.any?(segments, &(&1 in [".", ".."])) ->
        raise ArgumentError, "Archive entry path must not contain traversal segments: #{inspect(relative_path)}"

      true ->
        Path.join(segments)
    end
  end

  defp validate_zip_entries!(_zip_path, :all), do: :ok

  defp validate_zip_entries!(zip_path, allowed_paths) when is_list(allowed_paths) do
    allowed = allowed_paths |> Enum.map(&normalize_relative_path!/1) |> MapSet.new()
    zip_entries = zip_entries!(zip_path)
    entries = Enum.map(zip_entries, &normalize_relative_path!(&1.path))
    entry_set = MapSet.new(entries)

    cond do
      length(entries) != MapSet.size(entry_set) ->
        raise ArgumentError, "Archive contains duplicate entries"

      not MapSet.subset?(entry_set, allowed) ->
        extra_entries = entry_set |> MapSet.difference(allowed) |> MapSet.to_list()
        raise ArgumentError, "Archive contains undeclared entries: #{inspect(extra_entries)}"

      oversized_entry = Enum.find(zip_entries, &(Limits.validate_value(:max_extracted_file_size_bytes, &1.size) != :ok)) ->
        max = Limits.get(:max_extracted_file_size_bytes)
        raise ArgumentError, "Archive entry #{inspect(oversized_entry.path)} exceeds size limit #{max} bytes"

      true ->
        :ok
    end
  end

  defp zip_entries!(zip_path) do
    case :zip.table(String.to_charlist(zip_path)) do
      {:ok, entries} ->
        entries
        |> Enum.filter(&zip_file_entry?/1)
        |> Enum.map(fn {:zip_file, path, info, _comment, _offset, _compressed_size} ->
          %{path: List.to_string(path), size: zip_file_size(info)}
        end)

      {:error, reason} ->
        raise "Failed to inspect zip archive #{zip_path}: #{inspect(reason)}"
    end
  end

  defp zip_file_entry?({:zip_file, _path, _info, _comment, _offset, _compressed_size}), do: true
  defp zip_file_entry?(_entry), do: false

  defp zip_file_size({:file_info, size, _type, _access, _atime, _mtime, _ctime, _mode, _links, _major, _minor, _inode, _uid, _gid}), do: size
end
