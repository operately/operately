defmodule OperatelyWeb.Api.Types.Id do
  def decode(id) when id == nil or id == "" do
    {:ok, nil}
  end

  def decode(id) when is_binary(id) do
    remove_comments(id)
    |> Operately.ShortUuid.decode()
    |> handle_error()
  end

  defp remove_comments(id) do
    id |> String.split("-") |> List.last()
  end

  defp handle_error({:ok, id}), do: {:ok, id}
  defp handle_error({:error, _}), do: {:error, "Invalid id format"}
end
