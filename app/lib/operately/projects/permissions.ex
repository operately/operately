defmodule Operately.Projects.Permissions do
  import Ecto.Query, only: [from: 2]
  alias Operately.Access.Binding
  alias Operately.Projects.CheckIn

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
    :can_delete_milestone,
    :can_edit_check_in,
    :can_edit_contributors,
    :can_edit_description,
    :can_edit_goal,
    :can_edit_milestone,
    :can_edit_name,
    :can_edit_permissions,
    :can_edit_resources,
    :can_edit_space,
    :can_edit_retrospective,
    :can_edit_task,
    :can_edit_timeline,
    :can_pause,
    :can_delete,
    :can_view,
    :can_comment
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
      can_edit_milestone: access_level >= Binding.edit_access(),
      can_delete_milestone: access_level >= Binding.edit_access(),
      can_edit_check_in: access_level >= Binding.edit_access(),
      can_edit_description: access_level >= Binding.edit_access(),
      can_edit_timeline: access_level >= Binding.edit_access(),
      can_edit_resources: access_level >= Binding.edit_access(),
      can_edit_goal: access_level >= Binding.edit_access(),
      can_edit_name: access_level >= Binding.edit_access(),
      can_edit_space: access_level >= Binding.edit_access(),
      can_edit_retrospective: access_level >= Binding.edit_access(),
      can_close: access_level >= Binding.edit_access(),
      can_pause: access_level >= Binding.edit_access(),
      can_check_in: access_level >= Binding.edit_access(),
      can_edit_task: access_level >= Binding.edit_access(),
      can_acknowledge_check_in: access_level >= Binding.edit_access(),
      can_edit_contributors: access_level >= Binding.edit_access(),
      can_edit_permissions: access_level >= Binding.edit_access(),
      can_delete: access_level >= Binding.edit_access(),
      can_comment: access_level >= Binding.comment_access()
    }
  end

  def calculate(access_level, check_in, user_id) when is_integer(access_level) and is_binary(user_id) do
    base_permissions = calculate(access_level)

    %{base_permissions |
      can_acknowledge_check_in: can_acknowledge_check_in(check_in, user_id)
    }
  end

  def can_acknowledge_check_in(check_in, user_id) when is_binary(user_id) do
    check_in = preload_project_and_check_in(check_in)
    project = check_in.project

    # Similar logic to Goals: 
    # - If champion posts check-in, reviewer can acknowledge
    # - If reviewer posts check-in, champion can acknowledge  
    # - Otherwise, only reviewer can acknowledge (existing behavior)
    cond do
      check_in.author_id == get_champion_id(project) && get_reviewer_id(project) == user_id -> true
      check_in.author_id == get_reviewer_id(project) && get_champion_id(project) == user_id -> true
      true -> user_id == get_reviewer_id(project)
    end
  end

  def check(access_level, permission) do
    permissions = calculate(access_level)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      nil -> raise "Unknown permission: #{permission}"
    end
  end

  def check(access_level, check_in, user_id, permission) when is_atom(permission) and is_binary(user_id) do
    permissions = calculate(access_level, check_in, user_id)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      nil -> raise "Unknown permission: #{permission}"
    end
  end

  #
  # Helpers
  #

  defp preload_project_and_check_in(check_in = %CheckIn{}) do
    Operately.Repo.preload(check_in, [project: [:champion, :reviewer]])
  end

  defp preload_project_and_check_in(check_in_id) when is_binary(check_in_id) do
    from(c in CheckIn, 
      join: p in assoc(c, :project), 
      left_join: champion in assoc(p, :champion),
      left_join: reviewer in assoc(p, :reviewer),
      preload: [project: {p, [champion: champion, reviewer: reviewer]}], 
      where: c.id == ^check_in_id
    )
    |> Operately.Repo.one()
  end

  defp get_champion_id(project) do
    case project.champion do
      nil -> nil
      champion -> champion.id
    end
  end

  defp get_reviewer_id(project) do
    case project.reviewer do
      nil -> nil
      reviewer -> reviewer.id
    end
  end
end
