defmodule Operately.Goals.Permissions do
  def __api_typename__, do: "goal_permissions"

  alias Operately.Access.Binding
  alias Operately.Permissions.ReadOnly

  defstruct [
    :can_view,
    :can_edit,
    :can_comment,
    :has_full_access
  ]

  def calculate(access_level, company_read_only: company_read_only) do
    permissions = %__MODULE__{
      can_view: access_level >= Binding.view_access(),
      can_comment: access_level >= Binding.comment_access(),
      can_edit: access_level >= Binding.edit_access(),
      has_full_access: access_level >= Binding.full_access(),
    }

    if company_read_only, do: ReadOnly.view_only(permissions), else: permissions
  end

  def check(access_level, permission, company_read_only: company_read_only) when is_atom(permission) and is_integer(access_level) do
    permissions = calculate(access_level, company_read_only: company_read_only)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      nil -> raise "Unknown permission: #{permission}"
    end
  end
end
