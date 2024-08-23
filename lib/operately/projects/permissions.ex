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

  def calculate_permissions(project, user) do
    project = Operately.Repo.preload(project, :contributors)

    %__MODULE__{
      can_view: is_public_or_contributor?(project, user),

      can_comment_on_milestone: is_public_or_contributor?(project, user),
      can_complete_milestone: is_contributor?(project, user),
      can_reopen_milestone: is_contributor?(project, user),

      can_create_milestone: is_contributor?(project, user),
      can_delete_milestone: is_contributor?(project, user),
      can_edit_milestone: is_contributor?(project, user),
      can_edit_check_in: is_contributor?(project, user),
      can_edit_description: is_contributor?(project, user),
      can_edit_timeline: is_contributor?(project, user),
      can_edit_resources: is_contributor?(project, user),
      can_edit_goal: is_contributor?(project, user),
      can_edit_name: is_contributor?(project, user),
      can_edit_space: is_contributor?(project, user),
      can_edit_contributors: is_contributor?(project, user),
      can_edit_permissions: is_contributor?(project, user),

      can_close: is_contributor?(project, user),
      can_pause: is_contributor?(project, user),
      can_check_in: is_contributor?(project, user),
      can_acknowledge_check_in: is_reviewer?(project, user),
      can_edit_task: is_contributor?(project, user),
    }
  end

  defp calculate_permissions(access_level) do
    %__MODULE__{
      can_comment_on_milestone: can_comment_on_milestone(access_level),
      can_complete_milestone: can_complete_milestone(access_level),
      can_reopen_milestone: can_reopen_milestone(access_level),

      can_check_in: can_check_in(access_level),
      can_edit_check_in: can_edit_check_in(access_level),
      can_edit_contributors: can_edit_contributors(access_level),
      can_edit_description: can_edit_description(access_level),
      can_edit_milestone: can_edit_milestone(access_level),
      can_edit_name: can_edit_name(access_level),
      can_edit_permissions: can_edit_permissions(access_level),
      can_edit_resources: can_edit_resources(access_level),
      can_edit_space: can_edit_space(access_level),
      can_edit_task: can_edit_task(access_level),
      can_edit_timeline: can_edit_timeline(access_level),
      can_pause: can_pause(access_level),
    }
  end

  # ---

  defp is_contributor?(project, user) do
    Enum.any?(project.contributors, fn c -> c.person_id == user.id end)
  end

  defp is_reviewer?(project, user) do
    Enum.any?(project.contributors, fn c -> c.person_id == user.id && c.role == :reviewer end)
  end

  defp is_public?(project) do
    !project.private
  end

  defp is_public_or_contributor?(project, user) do
    is_public?(project) || is_contributor?(project, user)
  end


  def can_comment_on_milestone(access_level), do: access_level >= Binding.comment_access()
  def can_complete_milestone(access_level), do: access_level >= Binding.edit_access()
  def can_reopen_milestone(access_level), do: access_level >= Binding.edit_access()

  def can_check_in(access_level), do: access_level >= Binding.full_access()
  def can_edit_check_in(access_level), do: access_level >= Binding.full_access()
  def can_edit_contributors(access_level), do: access_level >= Binding.full_access()
  def can_edit_description(access_level), do: access_level >= Binding.edit_access()
  def can_edit_milestone(access_level), do: access_level >= Binding.edit_access()
  def can_edit_name(access_level), do: access_level >= Binding.edit_access()
  def can_edit_permissions(access_level), do: access_level >= Binding.full_access()
  def can_edit_resources(access_level), do: access_level >= Binding.edit_access()
  def can_edit_space(access_level), do: access_level >= Binding.edit_access()
  def can_edit_task(access_level), do: access_level >= Binding.edit_access()
  def can_edit_timeline(access_level), do: access_level >= Binding.edit_access()
  def can_pause(access_level), do: access_level >= Binding.edit_access()

  def check(access_level, permission) do
    permissions = calculate_permissions(access_level)

    if Map.get(permissions, permission) == true do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end
end
