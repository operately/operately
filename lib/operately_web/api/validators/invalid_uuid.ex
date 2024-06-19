defmodule OperatelyWeb.Api.Validations.UUID do
  defmodule InvalidUUID do
    defexception [:message, :field]
  end

  def validate_format!(uuid) do
    case Ecto.UUID.cast(uuid) do
      {:ok, _} -> :ok
      _ -> raise OperatelyWeb.Api.Validations.UUID.InvalidUUID, field: :goal_id
    end
  end
end
