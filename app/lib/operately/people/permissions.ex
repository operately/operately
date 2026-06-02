defmodule Operately.People.Permissions do
  alias Operately.Access.Binding
  alias Operately.Permissions.ReadOnly

  defstruct [
    :can_edit_profile,
  ]

  def calculate(access_level, company_read_only: company_read_only) do
    permissions = %__MODULE__{
      can_edit_profile: access_level >= Binding.edit_access()
    }

    if company_read_only, do: ReadOnly.deny_all(permissions), else: permissions
  end

  def check(access_level, permission, company_read_only: company_read_only) do
    permissions = calculate(access_level, company_read_only: company_read_only)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      nil -> raise "Unknown permission: #{permission}"
    end
  end
end
