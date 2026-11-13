defmodule OperatelyWeb.Api.Goals.CheckInInputs do
  alias OperatelyWeb.Api.Helpers

  def decode_target_values(nil, _targets), do: {:ok, nil}

  def decode_target_values(encoded, targets) when is_binary(encoded) do
    with {:ok, values} when is_list(values) <- Jason.decode(encoded),
         {:ok, values} <- decode_values(values),
         :ok <- validate_ids(Enum.map(values, & &1["id"]), targets) do
      {:ok, values}
    else
      _ -> {:error, :bad_request}
    end
  end

  def decode_target_values(_, _), do: {:error, :bad_request}

  def validate_checklist(nil, _checks), do: :ok
  def validate_checklist(items, checks), do: validate_ids(Enum.map(items, & &1.id), checks)

  defp decode_values(values) do
    Enum.reduce_while(values, {:ok, []}, fn
      %{"id" => id, "value" => value}, {:ok, acc} when is_binary(id) and is_number(value) ->
        case Helpers.decode_id(id) do
          {:ok, id} -> {:cont, {:ok, [%{"id" => id, "value" => value} | acc]}}
          _ -> {:halt, {:error, :bad_request}}
        end

      _, _ ->
        {:halt, {:error, :bad_request}}
    end)
    |> case do
      {:ok, values} -> {:ok, Enum.reverse(values)}
      error -> error
    end
  end

  defp validate_ids(ids, items) do
    allowed = MapSet.new(items, & &1.id)
    if Enum.uniq(ids) == ids and Enum.all?(ids, &MapSet.member?(allowed, &1)), do: :ok, else: {:error, :bad_request}
  end
end
