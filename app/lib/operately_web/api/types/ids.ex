defmodule OperatelyWeb.Api.Types.Id do
  def decode(id) when id == nil or id == "" do
    {:ok, nil}
  end

  def decode(id) when is_binary(id) do
    if is_canonical_uuid?(id) do
      {:ok, id}
    else
      id
      |> remove_comments()
      |> Operately.ShortUuid.decode()
      |> handle_error()
    end
  end

  defp remove_comments(id) do
    id |> String.split("-") |> List.last()
  end

  defp is_canonical_uuid?(id) do
    String.match?(id, ~r/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  end

  defp handle_error({:ok, id}), do: {:ok, id}
  defp handle_error({:error, _}), do: {:error, "Invalid id format"}
end
