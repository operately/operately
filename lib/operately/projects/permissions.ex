defmodule Operately.Projects.Permissions do

  def calculate_permissions(project, user) do
    project = Operately.Repo.preload(project, :contributors)

    %{
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

      can_pause: is_contributor?(project, user),
      can_check_in: is_contributor?(project, user),
      can_acknowledge_check_in: is_reviewer?(project, user)
    }
  end

  # ---

  defp is_contributor?(project, user) do
    Enum.any?(project.contributors, fn c -> c.person_id == user.id end)
  end

  # defp is_champion?(project, user) do
  #   Enum.any?(project.contributors, fn c -> c.person_id == user.id && c.role == :champion end)
  # end

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
