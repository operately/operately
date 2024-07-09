defmodule Operately.Projects.Permissions do
  defstruct [
    :can_view,
    :can_create_milestone,
    :can_delete_milestone,
    :can_edit_milestone,
    :can_edit_description,
    :can_edit_timeline,
    :can_edit_resources,
    :can_edit_goal,
    :can_edit_name,
    :can_edit_space,
    :can_edit_contributors,
    :can_edit_permissions,
    :can_pause,
    :can_check_in,
    :can_acknowledge_check_in
  ]

  def calculate_permissions(project, user) do
    project = Operately.Repo.preload(project, :contributors)

    %__MODULE__{
      can_view: is_public_or_contributor?(project, user),

      can_create_milestone: is_contributor?(project, user),
      can_delete_milestone: is_contributor?(project, user),
      can_edit_milestone: is_contributor?(project, user),
      can_edit_description: is_contributor?(project, user),
      can_edit_timeline: is_contributor?(project, user),
      can_edit_resources: is_contributor?(project, user),
      can_edit_goal: is_contributor?(project, user),
      can_edit_name: is_contributor?(project, user),
      can_edit_space: is_contributor?(project, user),
      can_edit_contributors: is_contributor?(project, user),
      can_edit_permissions: is_contributor?(project, user),

      can_pause: is_contributor?(project, user),
      can_check_in: is_contributor?(project, user),
      can_acknowledge_check_in: is_reviewer?(project, user)
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

end
