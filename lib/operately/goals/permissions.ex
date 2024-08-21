defmodule Operately.Goals.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_edit,
    :can_check_in,
    :can_acknowledge_check_in,
    :can_close,
    :can_archive,
    :can_reopen,
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
      can_check_in: can_check_in(access_level),
      can_edit: can_edit(access_level),
      can_reopen: can_edit(access_level),
    }
  end

  # ---

  defp is_champion?(goal, user) do
    goal.champion_id == user.id
  end

  defp is_reviewer?(goal, user) do
    goal.reviewer_id == user.id
  end

  def can_check_in(access_level), do: access_level >= Binding.full_access()
  def can_edit(access_level), do: access_level >= Binding.edit_access()
  def can_reopen(access_level), do: access_level >= Binding.edit_access()

  def check(access_level, permission) do
    permissions = calculate_permissions(access_level)

    if Map.get(permissions, permission) == true do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end
end
