defmodule Operately.Messages.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_archive_message,
  ]

  def calculate(person, message) do
    access_level = message.request_info.access_level

    %__MODULE__{
      can_archive_message: message.author_id == person.id || access_level >= Binding.full_access(),
    }
  end

  def check(person, message, permission) do
    permissions = calculate(person, message)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      nil -> raise "Unknown permission: #{permission}"
    end
  end
end
