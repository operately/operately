defmodule Operately.Companies.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_edit_trusted_email_domains,
    :can_invite_members,
    :can_remove_members,
  ]

  defp calculate_permissions(access_level) do
    %__MODULE__{
      can_edit_trusted_email_domains: access_level >= Binding.full_access(),
      can_invite_members: access_level >= Binding.full_access(),
      can_remove_members: access_level >= Binding.full_access(),
    }
  end

  def check(access_level, permission) do
    permissions = calculate_permissions(access_level)

    if Map.get(permissions, permission) == true do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end
end
