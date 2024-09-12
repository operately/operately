defmodule Operately.Operations.ProjectContributorEdited do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Projects
  alias Operately.Projects.Contributor
  alias Operately.Activities

  def run(creator, contributor, attrs) do
    Multi.new()
    |> lookup_context(contributor)
    |> update_contributor(contributor, attrs)
    |> update_bindings(contributor, attrs)
    |> insert_activity(creator, contributor)
    |> Repo.transaction()
    |> Repo.extract_result(:contributor)
  end

  defp update_contributor(multi, contributor, attrs) do
    Multi.update(multi, :contributor, Contributor.changeset(contributor, attrs))
  end

  defp lookup_context(mutli, contributor) do
    context = Access.get_context!(project_id: contributor.project_id)
    Multi.put(mutli, :context, context)
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

  defp insert_activity(multi, creator, contributor) do
    project = Projects.get_project!(contributor.project_id)
    old_access_level = access_level(project, contributor)

    Activities.insert_sync(multi, creator.id, :project_contributor_edited, fn changes ->
      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: project.id,
        previous_contributor: %{
          person_id: contributor.person_id,
          role: Atom.to_string(contributor.role),
          permissions: old_access_level,
        },
        updated_contributor: %{
          person_id: changes.contributor.person_id,
          role: Atom.to_string(changes.contributor.role),
          permissions: access_level(project, changes.contributor),
        }
      }
    end)
  end

  #
  # Helpers
  #

  defp access_level(project, contributor) do
    context = Access.get_context!(project_id: project.id)
    group = Access.get_group!(person_id: contributor.person_id)

    Access.get_binding(context_id: context.id, group_id: group.id).access_level
  end

  defp find_permissions(contributor, attrs) do
    if contributor.role in [:champion, :reviewer] do
      Binding.full_access()
    else
      attrs.permissions || Binding.edit_access()
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
    context = Access.get_context!(project_id: contributor.project_id)
    previous_group = Access.get_group!(person_id: contributor.person_id)
    new_group = Access.get_group!(person_id: attrs.person_id)
    permissions = find_permissions(contributor, attrs)

    if contributor.role in [:champion, :reviewer] do
      multi
      |> delete_binding(context, previous_group, contributor.role)
      |> Access.update_or_insert_binding(:contributor_binding, new_group, permissions, contributor.role)
    else
      multi
      |> delete_binding(context, previous_group)
      |> Access.update_or_insert_binding(:contributor_binding, new_group, permissions)
    end
  end

  defp delete_binding(multi, context, group, tag \\ nil) do
    Multi.run(multi, :deleted_binding, fn _, _ ->
      case tag do
        nil -> Access.get_binding!(context_id: context.id, group_id: group.id)
        _ -> Access.get_binding!(context_id: context.id, group_id: group.id, tag: tag)
      end
      |> Repo.delete()
    end)
  end

end
