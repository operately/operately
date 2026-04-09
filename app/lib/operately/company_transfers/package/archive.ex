defmodule Operately.CompanyTransfers.Package.Archive do
  def create!(zip_path, entries \\ []) when is_binary(zip_path) and is_list(entries) do
    File.mkdir_p!(Path.dirname(zip_path))

    normalized_entries =
      Enum.map(entries, fn
        {path, content} when is_binary(path) and is_binary(content) ->
          {String.to_charlist(path), content}

        %{path: path, content: content} when is_binary(path) and is_binary(content) ->
          {String.to_charlist(path), content}
      end)

    case :zip.create(String.to_charlist(zip_path), normalized_entries, []) do
      {:ok, _zip_file} ->
        zip_path

      {:error, reason} ->
        raise "Failed to create zip archive #{zip_path}: #{inspect(reason)}"
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
end
