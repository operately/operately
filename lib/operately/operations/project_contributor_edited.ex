defmodule Operately.Operations.ProjectContributorEdited do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Projects.Project
  alias Operately.Projects.Contributor
  alias Operately.Activities

  def run(creator, contributor, attrs) do
    Multi.new()
    |> update_contributor(contributor, attrs)
    |> update_bindings(contributor, attrs)
    |> insert_activity(creator, contributor, attrs)
    |> Repo.transaction()
    |> Repo.extract_result(:contributor)
  end

  defp update_contributor(multi, contributor, attrs) do
    Multi.update(multi, :contributor, Contributor.changeset(contributor, attrs))
  end

  defp update_bindings(multi, contributor, attrs) do
    Multi.run(multi, :bindings, fn _, _ ->
      level = access_level(contributor, attrs)
      context = Project.get_access_context(contributor.project_id)

      cond do
        person_changed?(contributor, attrs) -> 
          Access.bind_person(context, attrs.person_id, level)
          Access.unbind_person(context, contributor.person_id)

        persmission_changed?(attrs) ->
          Access.bind_person(context, contributor.person_id, level)

        true -> 
          {:ok, nil}
      end
    end)
  end

  defp insert_activity(multi, creator, contributor, attrs) do
    {:ok, project} = Project.get(:system, id: contributor.project_id)

    Activities.insert_sync(multi, creator.id, :project_contributor_edited, fn changes ->
      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: project.id,
        previous_contributor: %{
          person_id: contributor.person_id,
          role: Atom.to_string(contributor.role),
          permissions: access_level(contributor),
        },
        updated_contributor: %{
          person_id: changes.contributor.person_id,
          role: Atom.to_string(changes.contributor.role),
          permissions: access_level(changes.contributor, attrs),
        }
      }
    end)
  end

  #
  # Helpers
  #

  defp access_level(contributor, attrs \\ nil) do
    if contributor.role in [:champion, :reviewer] do
      Binding.full_access()
    else
      attrs[:permissions] || Binding.edit_access()
    end
  end

  defp persmission_changed?(attrs), do: attrs[:permissions]
  defp person_changed?(contributor, attrs), do: attrs[:person_id] && attrs[:person_id] != contributor.person_id

end
