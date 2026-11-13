defmodule OperatelyWeb.Mcp.CollaborationInputs do
  alias Operately.Access.Binding
  alias OperatelyWeb.Mcp.Catalog.JsonSchema
  alias OperatelyWeb.Mcp.Helpers

  @levels ~w(no_access view_access comment_access edit_access full_access)

  def level_schema, do: JsonSchema.string("Resource access level.", enum: @levels)

  def members_schema do
    JsonSchema.array(JsonSchema.object(%{"id" => JsonSchema.string("Person ID."), "access_level" => level_schema()}, required: ["id", "access_level"]))
  end

  def levels_schema(nested?) do
    keys = if nested?, do: ["public", "company", "space"], else: ["public", "company"]
    JsonSchema.object(Map.new(keys, &{&1, level_schema()}), required: keys)
  end

  def string(value) when is_binary(value), do: {:ok, value}
  def string(_), do: {:error, :invalid_arguments}
  def boolean(value) when is_boolean(value), do: {:ok, value}
  def boolean(_), do: {:error, :invalid_arguments}
  def positive(value) when is_integer(value) and value > 0, do: {:ok, value}
  def positive(_), do: {:error, :invalid_arguments}
  def nonnegative(value) when is_integer(value) and value >= 0, do: {:ok, value}
  def nonnegative(_), do: {:error, :invalid_arguments}

  def ids(values) when is_list(values), do: Helpers.decode_id_list(values)
  def ids(_), do: {:error, :invalid_arguments}

  def level(value) do
    with {:ok, level} <- Helpers.decode_enum(value, @levels), do: {:ok, Binding.from_atom(level)}
  end

  def levels(values, nested?) when is_map(values) do
    keys = if nested?, do: [:public, :company, :space], else: [:public, :company]

    Enum.reduce_while(keys, {:ok, %{}}, fn key, {:ok, acc} ->
      case level(values[Atom.to_string(key)]) do
        {:ok, value} -> {:cont, {:ok, Map.put(acc, key, value)}}
        error -> {:halt, error}
      end
    end)
  end

  def levels(_, _), do: {:error, :invalid_arguments}

  def members(values) when is_list(values), do: decode_items(values, &member/1)
  def members(_), do: {:error, :invalid_arguments}

  defp member(%{"id" => id, "access_level" => value}) do
    with {:ok, id} <- Helpers.decode_id(id),
         {:ok, level} <- level(value) do
      {:ok, %{id: id, access_level: level}}
    end
  end

  defp member(_), do: {:error, :invalid_arguments}

  defp decode_items(values, decoder) do
    Enum.reduce_while(values, {:ok, []}, fn value, {:ok, acc} ->
      case decoder.(value) do
        {:ok, decoded} -> {:cont, {:ok, [decoded | acc]}}
        error -> {:halt, error}
      end
    end)
    |> case do
      {:ok, decoded} -> {:ok, Enum.reverse(decoded)}
      error -> error
    end
  end
end
