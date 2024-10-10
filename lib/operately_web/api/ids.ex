defmodule OperatelyWeb.Api.Ids do
  def decode_id(ids) when is_list(ids) do
    Enum.reduce(ids, {:ok, []}, fn id, {:ok, acc} ->
      case decode_id(id) do
        {:ok, id} -> {:ok, [id | acc]}
        e -> e
      end
    end)
  end

  def decode_id(id) do
    case Ecto.UUID.cast(id) do
      {:ok, id} -> {:ok, id}
      :error -> decode_short_id(id)
    end
  end

  def decode_id(id, :allow_nil) do
    if id == nil || id == "" do
      {:ok, nil}
    else
      decode_id(id)
    end
  end

  def decode_company_id(id) do
    id_without_comments(id)
    |> Operately.Companies.ShortId.decode()
    |> handle_error()
  end

  defp decode_short_id(id) do
    id_without_comments(id) 
    |> Operately.ShortUuid.decode()
    |> handle_error()
  end

  defp id_without_comments(id) do
    id |> String.split("-") |> List.last()
  end

  defp handle_error({:ok, id}), do: {:ok, id}
  defp handle_error(:error), do: {:error, 422, "Invalid id format"}
end
