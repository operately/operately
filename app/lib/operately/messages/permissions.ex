defmodule Operately.Messages.Permissions do
  alias Operately.Access.Binding
  alias Operately.Permissions.ReadOnly

  defstruct [
    :can_archive_message,
  ]

  def can_publish?(person, message) do
    message.state in [:draft, :scheduled] and message.author_id == person.id and
      (not is_nil(message.messages_board_id) or message.request_info.access_level >= Binding.edit_access())
  end

  def calculate(person, message, company_read_only: company_read_only) do
    access_level = message.request_info.access_level

    permissions = %__MODULE__{
      can_archive_message: message.author_id == person.id || access_level >= Binding.full_access(),
    }

    if company_read_only, do: ReadOnly.deny_all(permissions), else: permissions
  end

  def check(person, message, permission, company_read_only: company_read_only) do
    permissions = calculate(person, message, company_read_only: company_read_only)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      nil -> raise "Unknown permission: #{permission}"
    end
  end
end
