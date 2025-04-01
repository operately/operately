defmodule Operately.Goals.Update.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_view,
    :can_create,
    :can_edit,
    :can_delete,
    :can_acknowledge,
    :can_comment,
  ]

  def calculate(access_level, goal, user_id) do
    %__MODULE__{
      can_view: can_view(access_level),
      can_create: can_create(access_level),
      can_edit: can_edit(access_level),
      can_delete: can_delete(access_level),
      can_acknowledge: can_acknowledge(access_level, goal, user_id),
      can_comment: can_comment(access_level)
    }
  end

  def can_view(access_level), do: access_level >= Binding.view_access()
  def can_create(access_level), do: access_level >= Binding.edit_access()
  def can_edit(access_level), do: access_level >= Binding.edit_access()
  def can_delete(access_level), do: access_level >= Binding.edit_access()
  def can_comment(access_level), do: access_level >= Binding.comment_access()

  def can_acknowledge(access_level, goal, user_id) do
    is_reviewer = goal.reviewer_id == user_id
    is_champion = goal.champion_id == user_id
    access_level >= Binding.full_access() or is_reviewer or is_champion
  end
end
