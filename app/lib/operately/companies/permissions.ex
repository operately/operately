defmodule Operately.Companies.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_view,
    :is_admin,
    :can_edit_trusted_email_domains,
    :can_invite_members,
    :can_remove_members,
    :can_restore_members,
    :can_create_space,
    :can_manage_admins,
    :can_manage_owners,
    :can_edit_details,
    :can_edit_members_access_levels,
  ]

  def calculate(access_level, company_read_only: company_read_only) when is_number(access_level) do
    permissions = %__MODULE__{
      can_view: access_level >= Binding.view_access(),
      is_admin: access_level >= Binding.admin_access(),
      can_edit_details: access_level >= Binding.admin_access(),
      can_invite_members: access_level >= Binding.admin_access(),
      can_remove_members: access_level >= Binding.admin_access(),
      can_restore_members: access_level >= Binding.admin_access(),
      can_edit_members_access_levels: access_level >= Binding.admin_access(),
      can_create_space: access_level >= Binding.edit_access(),
      can_manage_admins: access_level >= Binding.full_access() || dev_env?(),
      can_manage_owners: access_level >= Binding.full_access() || dev_env?(),
      can_edit_trusted_email_domains: access_level >= Binding.full_access(),
    }

    if company_read_only, do: apply_company_read_only(permissions), else: permissions
  end

  def check(access_level, permission, company_read_only: company_read_only) when is_number(access_level) do
    permissions = calculate(access_level, company_read_only: company_read_only)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      _ -> raise "Unknown permission: #{inspect(permission)}"
    end
  end

  def dev_env?() do
    Application.get_env(:operately, :app_env) == :dev
  end

  defp apply_company_read_only(permissions) do
    Enum.reduce(Map.keys(Map.from_struct(permissions)), permissions, fn
      key, acc when key in [:can_view, :is_admin, :can_remove_members] -> acc
      key, acc -> Map.put(acc, key, false)
    end)
  end
end
