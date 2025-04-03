defmodule Operately.Goals.Update.Permissions do
  alias Operately.Access.Binding
  alias Operately.Goals.Update

  defstruct [
    :can_view,
    :can_edit,
    :can_delete,
    :can_acknowledge,
    :can_comment,
  ]

  def calculate(access_level, update, user_id) when is_binary(user_id) do
    %__MODULE__{
      can_view: can_view(access_level),
      can_edit: can_edit(access_level),
      can_delete: can_delete(access_level),
      can_acknowledge: can_acknowledge(update, user_id),
      can_comment: can_comment(access_level)
    }
  end

  def can_view(access_level), do: access_level >= Binding.view_access()
  def can_edit(access_level), do: access_level >= Binding.edit_access()
  def can_delete(access_level), do: access_level >= Binding.edit_access()
  def can_comment(access_level), do: access_level >= Binding.comment_access()

  def can_acknowledge(%Update{} = update, user_id) when is_binary(user_id) do
    update = Operately.Repo.preload(update, :goal)
    goal = update.goal

    cond do
      update.author_id == goal.champion_id && goal.reviewer_id == user_id -> true
      update.author_id == goal.reviewer_id && goal.champion_id == user_id -> true
      true -> user_id == goal.reviewer_id
    end
  end

  def check_can_edit(access_level) do
    if can_edit(access_level) do
      {:ok, :allowed}
    else
      {:error, :unauthorized}
    end
  end

  def check(access_level, update, user_id, permission) when is_atom(permission) and is_binary(user_id) do
    permissions = calculate(access_level, update, user_id)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :unauthorized}
      nil -> raise "Unknown permission: #{permission}"
    end
  end
end
