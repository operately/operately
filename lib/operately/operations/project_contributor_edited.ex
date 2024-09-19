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
    |> insert_activity(creator, contributor, attrs)
    |> Repo.transaction()
    |> Repo.extract_result(:contributor)
  end

  defp update_contributor(multi, contributor, attrs) do
    if person_changed?(contributor, attrs) do
      handle_person_update(multi, contributor, attrs)
    else
      handle_simple_update(multi, contributor, attrs)
    end
  end

  #
  # A person update means that we are changing the person of the contributor. For example,
  # changing the champion of the project. This can also go in two ways: the new person is
  # already a contributor or not. If the person is already a contributor, we just need to
  # update the roles and permissions. 
  #
  # If the person is not a contributor, we need to create a new contributor record and bind
  # the person to the project.
  #
  defp handle_person_update(multi, contributor, attrs) do
    context = Project.get_access_context(contributor.project_id)

    case find_contributor(contributor.project_id, attrs.person_id) do
      nil ->
        multi
        |> Multi.insert(:new_contributor, fn _ ->
          Contributor.changeset(%{person_id: attrs.person_id, project_id: contributor.project_id, role: contributor.role})
        end)
        |> Multi.update(:contributor, fn _ ->
          Contributor.changeset(contributor, %{role: :contributor})
        end)
        |> Multi.run(:update_bindings, fn _, _ -> 
          Access.bind_person(context, attrs.person_id, attrs.permissions)
        end)

      other_contributor ->
        multi
        |> Multi.update(:new_contributor, fn _ ->
          Contributor.changeset(other_contributor, %{role: contributor.role})
        end)
        |> Multi.update(:contributor, fn _ ->
          Contributor.changeset(other_contributor, %{role: :contributor})
        end)
    end
  end

  # 
  # A simple update means that we are only updating the responsibility or the permissions
  # of the contributor. In this case, we only need to update the contributor record and
  # acess level on the binding.
  #
  defp handle_simple_update(multi, contributor, attrs) do
    level = access_level(contributor, attrs)
    context = Project.get_access_context(contributor.project_id)

    multi
    |> Multi.update(:contributor, fn _ ->
      Contributor.changeset(contributor, attrs)
    end)
    |> Multi.run(:update_bindings, fn _, _ -> 
      Access.bind_person(context, contributor.person_id, level)
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

  import Ecto.Query, only: [from: 2]

  defp access_level(contributor, attrs \\ nil) do
    if contributor.role in [:champion, :reviewer] do
      Binding.full_access()
    else
      attrs[:permissions] || Binding.edit_access()
    end
  end

  defp person_changed?(contributor, attrs), do: attrs[:person_id] && attrs[:person_id] != contributor.person_id

  defp find_contributor(project_id, person_id) do
    query = from(c in Contributor, where: c.project_id == ^project_id and c.person_id == ^person_id)

    Repo.one(query)
  end

end
