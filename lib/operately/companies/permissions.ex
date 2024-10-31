defmodule Operately.Companies.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_edit_trusted_email_domains,
    :can_invite_members,
    :can_remove_members,
    :can_create_space,
    :can_manage_admins,
    :can_manage_owners,
    :can_edit_details,
  ]

  def calculate(access_level) when is_number(access_level) do
    %__MODULE__{
      can_edit_details: access_level >= Binding.edit_access(),
      can_invite_members: access_level >= Binding.edit_access(),
      can_remove_members: access_level >= Binding.edit_access(),
      can_create_space: access_level >= Binding.view_access(),
      can_manage_admins: access_level >= Binding.full_access() || dev_env?(),
      can_manage_owners: access_level >= Binding.full_access() || dev_env?(),
      can_edit_trusted_email_domains: access_level >= Binding.full_access(),
    }
  end

  def check(access_level, permission) when is_number(access_level) do
    permissions = calculate(access_level)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      _ -> raise "Unknown permission: #{inspect(permission)}"
    end
  end

  def dev_env?() do
    Application.get_env(:operately, :app_env) == :dev
  end
end
