defmodule OperatelyWeb.Mcp.Tools.Goals.CheckInInputs do
  alias OperatelyWeb.Mcp.Catalog.JsonSchema
  alias OperatelyWeb.Mcp.Helpers

  def schema_properties do
    %{
      "due_date" => JsonSchema.nullable(JsonSchema.string("Goal due date in YYYY-MM-DD format. Omit to preserve; null clears it.", format: "date")),
      "target_values" =>
        JsonSchema.array(
          JsonSchema.object(
            %{
              "id" => JsonSchema.string("Goal target identifier."),
              "value" => JsonSchema.number("Updated target value.")
            },
            required: ["id", "value"]
          ),
          description: "Complete target snapshot for this check-in. Omit to preserve progress."
        ),
      "checklist" =>
        JsonSchema.array(
          JsonSchema.object(
            %{
              "id" => JsonSchema.string("Goal check identifier."),
              "name" => JsonSchema.string("Check name."),
              "completed" => JsonSchema.boolean("Whether the check is complete."),
              "index" => JsonSchema.integer("Check ordering index.", minimum: 0)
            },
            required: ["id", "name", "completed", "index"]
          ),
          description: "Complete checklist snapshot. Omit to preserve progress."
        )
    }
  end

  def decode(arguments) do
    with {:ok, inputs} <- Helpers.put_present(%{}, arguments, "due_date", :due_date, &Helpers.parse_day_date/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "target_values", :new_target_values, &target_values/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "checklist", :checklist, &checklist/1) do
      {:ok, inputs}
    end
  end

  defp target_values(values) when is_list(values) do
    with {:ok, values} <- decode_items(values, &target_value/1) do
      {:ok, Jason.encode!(values)}
    end
  end

  defp target_values(_), do: {:error, :invalid_arguments}

  defp target_value(%{"id" => id, "value" => value}) when is_number(value) do
    with {:ok, id} <- Helpers.decode_id(id) do
      {:ok, %{"id" => Operately.ShortUuid.encode!(id), "value" => value}}
    end
  end

  defp target_value(_), do: {:error, :invalid_arguments}

  defp checklist(values) when is_list(values), do: decode_items(values, &check/1)
  defp checklist(_), do: {:error, :invalid_arguments}

  defp check(%{"id" => id, "name" => name, "completed" => completed, "index" => index})
       when is_binary(name) and is_boolean(completed) and is_integer(index) and index >= 0 do
    with {:ok, id} <- Helpers.decode_id(id) do
      {:ok, %{id: id, name: name, completed: completed, index: index}}
    end
  end

  defp check(_), do: {:error, :invalid_arguments}

  defp decode_items(items, decoder) do
    Enum.reduce_while(items, {:ok, []}, fn item, {:ok, acc} ->
      case decoder.(item) do
        {:ok, item} -> {:cont, {:ok, [item | acc]}}
        error -> {:halt, error}
      end
    end)
    |> case do
      {:ok, items} -> {:ok, Enum.reverse(items)}
      error -> error
    end
  end
end
