defmodule Operately.Groups.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_create_goal,
    :can_create_project,
    :can_create_resource_hub,
    :can_comment_on_discussions,
    :can_edit,
    :can_edit_discussions,
    :can_edit_members_permissions,
    :can_edit_permissions,
    :can_join,
    :can_post_discussions,
    :can_remove_member,
    :can_view,
    :can_view_message,
    :can_add_members,
  ]

  def calculate_permissions(access_level) do
    %__MODULE__{
      can_create_goal: can_create_goal(access_level),
      can_create_project: can_create_project(access_level),
      can_create_resource_hub: can_create_resource_hub(access_level),
      can_comment_on_discussions: can_comment_on_discussions(access_level),
      can_edit: can_edit(access_level),
      can_edit_discussions: can_edit_discussions(access_level),
      can_edit_members_permissions: can_edit_members_permissions(access_level),
      can_edit_permissions: can_edit_permissions(access_level),
      can_join: can_join(access_level),
      can_post_discussions: can_post_discussions(access_level),
      can_remove_member: can_remove_member(access_level),
      can_view: can_view(access_level),
      can_view_message: can_view_message(access_level),
      can_add_members: can_add_members(access_level),
    }
  end

  def can_create_goal(access_level), do: access_level >= Binding.edit_access()
  def can_create_project(access_level), do: access_level >= Binding.edit_access()
  def can_create_resource_hub(access_level), do: access_level >= Binding.edit_access()
  def can_comment_on_discussions(access_level), do: access_level >= Binding.comment_access()
  def can_edit(access_level), do: access_level >= Binding.edit_access()
  def can_edit_discussions(access_level), do: access_level >= Binding.edit_access()
  def can_edit_members_permissions(access_level), do: access_level >= Binding.full_access()
  def can_edit_permissions(access_level), do: access_level >= Binding.full_access()
  def can_join(access_level), do: access_level >= Binding.view_access()
  def can_post_discussions(access_level), do: access_level >= Binding.edit_access()
  def can_remove_member(access_level), do: access_level >= Binding.full_access()
  def can_view(access_level), do: access_level >= Binding.view_access()
  def can_view_message(access_level), do: access_level >= Binding.view_access()
  def can_add_members(access_level), do: access_level >= Binding.full_access()

  def check(access_level, permission) when is_number(access_level) and is_atom(permission) do
    permissions = calculate_permissions(access_level)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      nil -> raise ArgumentError, "Unknown permission: #{inspect permission}"
    end
  end
end
