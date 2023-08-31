defmodule Operately.Projects.Permissions do

  def calculate_permissions(project, user) do
    project = Operately.Repo.preload(project, :contributors)

    %{
      can_view: can_view?(project, user),
      can_edit_contributors: can_edit_contributors?(project, user)
    }
  end

  defp can_view?(project, user) do
    is_public?(project) || is_contributor?(project, user)
  end

  defp can_edit_contributors?(project, user) do
    is_contributor?(project, user)
  end

  defp is_contributor?(project, user) do
    Enum.any?(project.contributors, fn c -> c.person_id == user.id end)
  end

  defp is_public?(project) do
    !project.private
  end

end
