defmodule Operately.Groups.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_create_goal,
    :can_edit,
    :can_edit_discussions,
    :can_edit_members_permissions,
    :can_edit_permissions,
    :can_join,
    :can_post_discussions,
    :can_remove_member,
    :can_view,
  ]

  def calculate_permissions(access_level) do
    %__MODULE__{
      can_create_goal: can_create_goal(access_level),
      can_edit: can_edit(access_level),
      can_edit_discussions: can_edit_discussions(access_level),
      can_edit_members_permissions: can_edit_members_permissions(access_level),
      can_edit_permissions: can_edit_permissions(access_level),
      can_join: can_join(access_level),
      can_post_discussions: can_post_discussions(access_level),
      can_remove_member: can_remove_member(access_level),
      can_view: can_view(access_level),
    }
  end

  def can_create_goal(access_level), do: access_level >= Binding.edit_access()
  def can_edit(access_level), do: access_level >= Binding.edit_access()
  def can_edit_discussions(access_level), do: access_level >= Binding.edit_access()
  def can_edit_members_permissions(access_level), do: access_level >= Binding.full_access()
  def can_edit_permissions(access_level), do: access_level >= Binding.full_access()
  def can_join(access_level), do: access_level >= Binding.full_access()
  def can_post_discussions(access_level), do: access_level >= Binding.edit_access()
  def can_remove_member(access_level), do: access_level >= Binding.full_access()
  def can_view(access_level), do: access_level >= Binding.view_access()

  def check(access_level, permission) do
    permissions = calculate_permissions(access_level)

    if Map.get(permissions, permission) == true do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end
end
