defmodule Operately.Operations.ProjectContributorEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Projects
  alias Operately.Projects.Contributor
  alias Operately.Activities

  def run(creator, contributor, attrs) do
    Multi.new()
    |> Multi.update(:contributor, Contributor.changeset(contributor, attrs))
    |> Multi.run(:context, fn _, _ ->
      {:ok, Access.get_context!(project_id: contributor.project_id)}
    end)
    |> update_bindings(contributor, attrs)
    |> insert_activity(creator, contributor, attrs)
    |> Repo.transaction()
    |> Repo.extract_result(:contributor)
  end

  defp update_bindings(multi, contributor, attrs) when contributor.person_id == attrs.person_id do
    if is_reviewer_or_contributor?(contributor) do
      multi
    else
      group = Access.get_group!(person_id: contributor.person_id)
      Access.update_or_insert_binding(multi, :contributor_binding, group, attrs.permissions)
    end
  end

  defp update_bindings(multi, contributor, attrs) when contributor.person_id != attrs.person_id do
    previous_group = Access.get_group!(person_id: contributor.person_id)
    new_group = Access.get_group!(person_id: attrs.person_id)
    permissions = find_permissions(contributor, attrs)

    multi
    |> delete_binding(previous_group)
    |> Access.update_or_insert_binding(:contributor_binding, new_group, permissions)
  end

  defp insert_activity(multi, creator, contributor, attrs) do
    project = Projects.get_project!(contributor.project_id)

    Activities.insert_sync(multi, creator.id, :project_contributor_edited, fn changes ->
      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: project.id,
        previous_contributor_id: contributor.person_id,
        previous_role: Atom.to_string(contributor.role),
        new_contributor_id: changes.contributor.person_id,
        new_role: Atom.to_string(changes.contributor.role),
        new_permissions: find_permissions(changes.contributor, attrs),
      }
    end)
  end

  #
  # Helpers
  #

  defp delete_binding(multi, group) do
    Multi.run(multi, :deleted_binding, fn _, changes ->
      Access.get_binding!(context_id: changes.context.id, group_id: group.id)
      |> Repo.delete()
    end)
  end

  defp find_permissions(contributor, attrs) do
    if is_reviewer_or_contributor?(contributor) do
      Binding.full_access()
    else
      attrs.permissions
    end
  end

  defp is_reviewer_or_contributor?(contributor) do
    case contributor.role do
      :champion -> true
      :reviewer -> true
      :contributor -> false
    end
  end
end
