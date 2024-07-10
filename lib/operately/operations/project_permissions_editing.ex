defmodule Operately.Operations.ProjectPermissionsEditing do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Activities

  def run(author, project, attrs) do
    Multi.new()
    |> Multi.run(:context, fn _, _ ->
      {:ok, Access.get_context!(project_id: project.id)}
    end)
    |> Access.update_bindings_to_company(project.company_id, attrs.company, attrs.public)
    |> maybe_update_bidings_to_space(project, attrs)
    |> insert_activity(author, project)
    |> Repo.transaction()
  end

  defp maybe_update_bidings_to_space(multi, project, attrs) do
    company_space_id = Repo.one!(from(c in Operately.Companies.Company, where: c.id == ^project.company_id, select: c.company_space_id))

    if project.group_id != company_space_id do
      multi
      |> Access.update_bindings_to_space(project.group_id, attrs.space)
    else
      multi
    end
  end

  defp insert_activity(multi, author, project) do
    multi
    |> Activities.insert_sync(author.id, :project_permissions_edited, fn changes ->
      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: project.id,
        previous_permissions: %{
          public: find_access_level(changes, :anonymous_binding, :previous),
          company: find_access_level(changes, :company_members_binding, :previous),
          space: find_access_level(changes, :space_members_binding, :previous),
        },
        new_permissions: %{
          public: find_access_level(changes, :anonymous_binding, :updated),
          company: find_access_level(changes, :company_members_binding, :updated),
          space: find_access_level(changes, :space_members_binding, :updated),
        }
      }
    end)
  end

  defp find_access_level(changes, level, version) do
    case Map.has_key?(changes, level) do
      true -> Map.get(changes[level], version).access_level
      false -> nil
    end
  end
end
