defmodule Operately.Messages.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_archive_message,
  ]

  def calculate(access_level) when is_integer(access_level) do
    %__MODULE__{
      can_archive_message: access_level >= Binding.full_access(),
    }
  end

  def check(message = %Operately.Messages.Message{}, permission) do
    check(message.request_info.access_level, permission)
  end

  def check(access_level, permission) when is_integer(access_level) and is_atom(permission) do
    permissions = calculate(access_level)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      nil -> raise "Unknown permission: #{permission}"
    end
  end
end
