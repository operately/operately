defmodule Operately.Projects.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_acknowledge_check_in,
    :can_check_in,
    :can_close,
    :can_comment_on_milestone,
    :can_complete_milestone,
    :can_reopen_milestone,
    :can_create_milestone,
    :can_delete_milestone,
    :can_comment_on_check_in,
    :can_edit_check_in,
    :can_edit_contributors,
    :can_edit_description,
    :can_edit_goal,
    :can_edit_milestone,
    :can_edit_name,
    :can_edit_permissions,
    :can_edit_resources,
    :can_edit_space,
    :can_edit_task,
    :can_edit_timeline,
    :can_pause,
    :can_view,
  ]

  def calculate(access_level) do
    %__MODULE__{
      can_view: can_view(access_level),

      can_comment_on_milestone: can_comment_on_milestone(access_level),
      can_complete_milestone: can_complete_milestone(access_level),
      can_reopen_milestone: can_reopen_milestone(access_level),
      can_create_milestone: can_edit_milestone(access_level),
      can_edit_milestone: can_edit_milestone(access_level),
      can_delete_milestone: can_edit_milestone(access_level),

      can_comment_on_check_in: can_comment_on_check_in(access_level),
      can_edit_check_in: can_edit_check_in(access_level),
      can_edit_description: can_edit_description(access_level),
      can_edit_timeline: can_edit_timeline(access_level),
      can_edit_resources: can_edit_resources(access_level),
      can_edit_goal: can_edit_goal(access_level),
      can_edit_name: can_edit_name(access_level),
      can_edit_space: can_edit_space(access_level),
      can_edit_contributors: can_edit_contributors(access_level),
      can_edit_permissions: can_edit_permissions(access_level),

      can_close: can_pause(access_level),
      can_pause: can_pause(access_level),
      can_check_in: can_check_in(access_level),
      can_acknowledge_check_in: can_edit_task(access_level),
      can_edit_task: can_edit_task(access_level),
    }
  end

  # ---

  defp can_view(access_level), do: access_level >= Binding.view_access()
  defp can_comment_on_milestone(access_level), do: access_level >= Binding.comment_access()
  defp can_complete_milestone(access_level), do: access_level >= Binding.edit_access()
  defp can_edit_milestone(access_level), do: access_level >= Binding.edit_access()
  defp can_reopen_milestone(access_level), do: access_level >= Binding.edit_access()
  defp can_comment_on_check_in(access_level), do: access_level >= Binding.comment_access()
  defp can_check_in(access_level), do: access_level >= Binding.full_access()
  defp can_edit_check_in(access_level), do: access_level >= Binding.full_access()
  defp can_edit_contributors(access_level), do: access_level >= Binding.full_access()
  defp can_edit_description(access_level), do: access_level >= Binding.edit_access()
  defp can_edit_name(access_level), do: access_level >= Binding.edit_access()
  defp can_edit_permissions(access_level), do: access_level >= Binding.full_access()
  defp can_edit_resources(access_level), do: access_level >= Binding.edit_access()
  defp can_edit_space(access_level), do: access_level >= Binding.edit_access()
  defp can_edit_task(access_level), do: access_level >= Binding.edit_access()
  defp can_edit_timeline(access_level), do: access_level >= Binding.edit_access()
  defp can_pause(access_level), do: access_level >= Binding.edit_access()
  defp can_edit_goal(access_level), do: access_level >= Binding.edit_access()

  def check(access_level, permission) do
    permissions = calculate(access_level)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      nil -> raise "Unknown permission: #{permission}"
    end
  end
end
