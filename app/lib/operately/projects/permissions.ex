defmodule Operately.Projects.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_acknowledge_check_in,
    :can_check_in,
    :can_close,
    :can_comment_on_milestone,
    :can_comment_on_check_in,
    :can_comment_on_retrospective,
    :can_comment_on_task,
    :can_complete_milestone,
    :can_reopen_milestone,
    :can_create_milestone,
    :can_create_task,
    :can_create_discussion,
    :can_delete_milestone,
    :can_edit,
    :can_edit_permissions,
    :can_edit_space,
    :can_pause,
    :can_resume,
    :can_delete,
    :can_view,
    :can_comment,
    :has_full_access
  ]

  def calculate(access_level) when is_integer(access_level) do
    %__MODULE__{
      can_view: access_level >= Binding.view_access(),
      can_comment_on_milestone: access_level >= Binding.comment_access(),
      can_comment_on_check_in: access_level >= Binding.comment_access(),
      can_comment_on_retrospective: access_level >= Binding.comment_access(),
      can_comment_on_task: access_level >= Binding.comment_access(),
      can_complete_milestone: access_level >= Binding.edit_access(),
      can_reopen_milestone: access_level >= Binding.edit_access(),
      can_create_milestone: access_level >= Binding.edit_access(),
      can_create_task: access_level >= Binding.edit_access(),
      can_create_discussion: access_level >= Binding.edit_access(),
      can_edit: access_level >= Binding.edit_access(),
      can_edit_space: access_level >= Binding.full_access(),
      can_edit_permissions: access_level >= Binding.full_access(),
      can_delete_milestone: access_level >= Binding.edit_access(),
      can_close: access_level >= Binding.edit_access(),
      can_pause: access_level >= Binding.edit_access(),
      can_resume: access_level >= Binding.edit_access(),
      can_check_in: access_level >= Binding.edit_access(),
      can_acknowledge_check_in: access_level >= Binding.edit_access(),
      can_delete: access_level >= Binding.full_access(),
      can_comment: access_level >= Binding.comment_access(),
      has_full_access: access_level >= Binding.full_access()
    }
  end

  def check(access_level, permission) do
    permissions = calculate(access_level)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      nil -> raise "Unknown permission: #{permission}"
    end
  end
end
