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

  defp update_bindings(multi, contributor, attrs) do
    cond do
      person_changed?(contributor, attrs) -> 
        transfer_binding_to_new_person(multi, contributor, attrs)
      persmission_changed?(attrs) ->
        update_persmission(multi, contributor, attrs)
      true -> 
        multi
    end
  end

  defp insert_activity(multi, creator, contributor, attrs) do
    project = Projects.get_project!(contributor.project_id)

    Activities.insert_sync(multi, creator.id, :project_contributor_edited, fn changes ->
      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: project.id,
        previous_contributor: %{
          person_id: contributor.person_id,
          role: Atom.to_string(contributor.role),
        },
        updated_contributor: %{
          person_id: changes.contributor.person_id,
          role: Atom.to_string(changes.contributor.role),
          permissions: attrs[:person_id] && find_permissions(changes.contributor, attrs),
        }
      }
    end)
  end

  #
  # Helpers
  #

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

  defp person_changed?(contributor, attrs) do
    attrs[:person_id] && attrs[:person_id] != contributor.person_id
  end

  defp persmission_changed?(attrs) do
    attrs[:permissions]
  end

  defp update_persmission(multi, contributor, attrs) do
    group = Access.get_group!(person_id: contributor.person_id)
    Access.update_or_insert_binding(multi, :contributor_binding, group, attrs.permissions)
  end

  defp transfer_binding_to_new_person(multi, contributor, attrs) do
    previous_group = Access.get_group!(person_id: contributor.person_id)
    new_group = Access.get_group!(person_id: attrs.person_id)
    permissions = find_permissions(contributor, attrs)

    if is_reviewer_or_contributor?(contributor) do
      tag = contributor.role

      multi
      |> delete_binding(previous_group, tag)
      |> Access.update_or_insert_binding(:contributor_binding, new_group, permissions, tag)
    else
      multi
      |> delete_binding(previous_group)
      |> Access.update_or_insert_binding(:contributor_binding, new_group, permissions)
    end
  end

  defp delete_binding(multi, group, tag \\ nil) do
    Multi.run(multi, :deleted_binding, fn _, changes ->
      case tag do
        nil -> Access.get_binding!(context_id: changes.context.id, group_id: group.id)
        _ -> Access.get_binding!(context_id: changes.context.id, group_id: group.id, tag: tag)
      end
      |> Repo.delete()
    end)
  end


end
