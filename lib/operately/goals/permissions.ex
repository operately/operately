defmodule Operately.Goals.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_view,
    :can_edit,
    :can_edit_check_in,
    :can_check_in,
    :can_acknowledge_check_in,
    :can_close,
    :can_archive,
    :can_reopen,
    :can_comment_on_update,
  ]

  def calculate(goal, user) do
    %__MODULE__{
      can_edit: is_champion?(goal, user) || is_reviewer?(goal, user),
      can_check_in: is_champion?(goal, user) || is_reviewer?(goal, user),
      can_acknowledge_check_in: is_reviewer?(goal, user),
      can_close: is_champion?(goal, user) || is_reviewer?(goal, user),
      can_archive: is_champion?(goal, user) || is_reviewer?(goal, user),
    }
  end

  defp calculate_permissions(access_level) do
    %__MODULE__{
      can_view: can_view(access_level),

      can_acknowledge_check_in: can_acknowledge_check_in(access_level),
      can_check_in: can_check_in(access_level),
      can_edit_check_in: can_edit_check_in(access_level),
      can_edit: can_edit(access_level),
      can_reopen: can_edit(access_level),
      can_comment_on_update: can_comment_on_update(access_level)
    }
  end

  # ---

  defp is_champion?(goal, user) do
    goal.champion_id == user.id
  end

  defp is_reviewer?(goal, user) do
    goal.reviewer_id == user.id
  end

  def can_view(access_level), do: access_level >= Binding.view_access()
  def can_acknowledge_check_in(access_level), do: access_level >= Binding.full_access()
  def can_check_in(access_level), do: access_level >= Binding.full_access()
  def can_edit_check_in(access_level), do: access_level >= Binding.full_access()
  def can_edit(access_level), do: access_level >= Binding.edit_access()
  def can_reopen(access_level), do: access_level >= Binding.edit_access()
  def can_comment_on_update(access_level), do: access_level >= Binding.comment_access()

  def check(access_level, permission) do
    permissions = calculate_permissions(access_level)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      nil -> raise "Unknown permission: #{permission}"
    end
  end
end
