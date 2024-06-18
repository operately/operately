defmodule MyApp.S3Test do
  use ExUnit.Case, async: true

  alias ExAws.S3

  @bucket "test-bucket"
  @file_path "path/to/test/file.txt"
  @file_content "Hello, S3Mock!"

  setup do
    case S3.put_bucket(@bucket, []) |> ExAws.request() do
      {:ok, _} -> :ok
      {:error, reason} -> raise "Failed to create bucket: #{inspect(reason)}"
    end

    on_exit fn ->
      S3.list_objects(@bucket) |> ExAws.request()
      |> case do
        {:ok, %{body: %{contents: contents}}} ->
          Enum.each(contents, fn %{key: key} ->
            S3.delete_object(@bucket, key) |> ExAws.request()
          end)
        _ -> :ok
      end

      S3.delete_bucket(@bucket) |> ExAws.request()
    end

    :ok
  end

  test "upload file to S3" do
    case S3.put_object(@bucket, @file_path, @file_content) |> ExAws.request() do
      {:ok, _} -> :ok
      {:error, reason} -> raise "Failed to upload file: #{inspect(reason)}"
    end

    case S3.get_object(@bucket, @file_path) |> ExAws.request() do
      {:ok, %{body: body}} ->
        assert body == @file_content
      {:error, reason} -> raise "Failed to get file: #{inspect(reason)}"
    end
  end

  test "list files in bucket" do
    case S3.put_object(@bucket, @file_path, @file_content) |> ExAws.request() do
      {:ok, _} -> :ok
      {:error, reason} -> raise "Failed to upload file: #{inspect(reason)}"

    end

    case S3.list_objects(@bucket) |> ExAws.request() do
      {:ok, %{body: %{contents: contents}}} ->
        assert Enum.any?(contents, fn %{key: key} -> key == @file_path end)
      {:error, reason} -> raise "Failed to list objects: #{inspect(reason)}"
    end
  end
end
