defmodule Operately.Projects.Permissions do

  def calculate_permissions(project, user) do
    project = Operately.Repo.preload(project, :contributors)

    %{
      can_view: can_view?(project, user),
      can_edit_contributors: can_edit_contributors?(project, user),

      can_create_milestone: can_create_milestone?(project, user),
      can_delete_milestone: can_delete_milestone?(project, user),
      can_edit_milestone: can_edit_milestone?(project, user)
    }
  end

  defp can_view?(project, user) do
    is_public?(project) || is_contributor?(project, user)
  end

  defp can_edit_contributors?(project, user), do: is_contributor?(project, user)
  defp can_create_milestone?(project, user), do: is_contributor?(project, user)
  defp can_delete_milestone?(project, user), do: is_contributor?(project, user)
  defp can_edit_milestone?(project, user), do: is_contributor?(project, user)

  # ---

  defp is_contributor?(project, user) do
    Enum.any?(project.contributors, fn c -> c.person_id == user.id end)
  end

  defp is_public?(project) do
    !project.private
  end

end
