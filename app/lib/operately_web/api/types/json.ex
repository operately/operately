defmodule OperatelyWeb.Api.Types.Json do
  use Gettext, backend: OperatelyWeb.Gettext
  def decode(content) when is_binary(content) do
    case Jason.decode(content) do
      {:ok, decoded} -> {:ok, decoded}
      {:error, _} -> {:error, gettext("Invalid JSON format")}
    end
  end

  def decode(content) when is_nil(content) do
    {:ok, nil}
  end

  def decode(_content) do
    {:error, gettext("Content must be a string or nil")}
  end
end
