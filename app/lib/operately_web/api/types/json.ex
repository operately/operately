defmodule OperatelyWeb.Api.Types.Json do
  def decode(content) when is_binary(content) do
    case Jason.decode(content) do
      {:ok, decoded} -> {:ok, decoded}
      {:error, _} -> {:error, :bad_request, "Invalid JSON format"}
    end
  end

  def decode(content) when is_nil(content) do
    {:ok, nil}
  end

  def decode(_content) do
    {:error, :bad_request, "Content must be a string or nil"}
  end
end
