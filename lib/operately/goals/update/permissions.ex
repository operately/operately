defmodule Operately.Goals.Update.Permissions do
  alias Operately.Access.Binding
  alias Operately.Repo
  alias Operately.Goals.Goal

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

  # Basic permissions
  def can_view(access_level), do: access_level >= Binding.view_access()
  def can_create(access_level), do: access_level >= Binding.edit_access()
  def can_edit(access_level), do: access_level >= Binding.edit_access()
  def can_delete(access_level), do: access_level >= Binding.edit_access()
  def can_comment(access_level), do: access_level >= Binding.comment_access()

  # can_acknowledge logic
  def can_acknowledge(access_level, goal, user_id) do
    is_reviewer = goal.reviewer_id == user_id
    is_champion = goal.champion_id == user_id
    access_level >= Binding.full_access() or is_reviewer or is_champion
  end

  # Special rules - can be expanded as needed
  def can_edit_own_update(access_level, %Operately.Goals.Update{} = update, person_id) do
    is_author = update.author_id == person_id
    is_recent = DateTime.diff(DateTime.utc_now(), update.inserted_at, :hour) <= 24

    (is_author and is_recent and access_level >= Binding.comment_access()) or
    access_level >= Binding.edit_access()
  end

  def check(access_level, permission) when is_atom(permission) and is_integer(access_level) do
    permissions = calculate(access_level, nil, nil)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      nil -> raise "Unknown update permission: #{permission}"
    end
  end

  def check_with_context(access_level, :can_acknowledge, update, user_id) do
    case update.goal do
      nil ->
        {:error, :forbidden} # Goal must be preloaded

      goal ->
        if can_acknowledge(access_level, goal, user_id) do
          {:ok, :allowed}
        else
          {:error, :forbidden}
        end
    end
  end

  def check_with_context(access_level, permission, update, person_id) when is_atom(permission) do
    case permission do
      :can_edit ->
        if can_edit_own_update(access_level, update, person_id) do
          {:ok, :allowed}
        else
          {:error, :forbidden}
        end
      _ ->
        check(access_level, permission)
    end
  end
end
