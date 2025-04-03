defmodule Operately.Operations.ProjectPermissionsEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Activities

  def run(author, project, attrs) do
    Multi.new()
    |> Multi.run(:context, fn _, _ ->
      {:ok, Access.get_context!(project_id: project.id)}
    end)
    |> update_bindings(project, attrs)
    |> insert_activity(author, project)
    |> Repo.transaction()
  end

  defp update_bindings(multi, project, attrs) do
    company = Access.get_group!(company_id: project.company_id, tag: :standard)
    space = Access.get_group!(group_id: project.group_id, tag: :standard)

    multi
    |> Access.maybe_update_anonymous_binding(project.company_id, attrs.public)
    |> Access.update_or_insert_binding(:company_members_binding, company, attrs.company)
    |> Access.update_or_insert_binding(:space_members_binding, space, attrs.space)
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
