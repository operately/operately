defmodule Operately.Operations.ProjectContributorEdited do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Projects.Project
  alias Operately.Projects.Contributor
  alias Operately.Activities

  def run(author, contributor, attrs) do
    if person_changed?(contributor, attrs) do
      handle_person_update(author, contributor, attrs)
    else
      handle_simple_update(author, contributor, attrs)
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
  defp handle_person_update(author, contributor, attrs) do
    case find_contributor(contributor.project_id, attrs.person_id) do
      nil -> handle_new_person_selected(author, contributor, attrs)
      other_contributor -> handle_project_contributor_selected(author, contributor, other_contributor)
    end
  end

  #
  # A new person was selected to be the champion or reviewer of the project. This person is not
  # a contributor yet, so we need to create a new contributor record and bind the person to the
  # project.
  #
  defp handle_new_person_selected(author, contributor, attrs) do
    {:ok, project} = Project.get(:system, id: contributor.project_id)
    context = Project.get_access_context(contributor.project_id)

    Multi.new()
    |> Multi.update(:old_contributor, fn _ ->
      Contributor.changeset(contributor, %{role: :contributor})
    end)
    |> Multi.insert(:new_contributor, fn _ ->
      Contributor.changeset(%{person_id: attrs.person_id, project_id: contributor.project_id, role: contributor.role})
    end)
    |> Multi.run(:update_bindings, fn _, _ -> 
      Access.bind_person(context, attrs.person_id, access_level(contributor, attrs))
    end)
    |> Activities.insert_sync(author.id, :project_contributor_edited, fn changes ->
      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: project.id,
        previous_contributor: serialize_contributor(changes.old_contributor),
        updated_contributor: serialize_contributor(changes.new_contributor)
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:new_contributor)
  end

  #
  # A new person was selected to be the champion or reviewer of the project, but this person
  # is already a contributor. In this case, we just need to update the roles and permissions
  # of the contributor.
  #
  defp handle_project_contributor_selected(author, old_contributor, new_contributor) do
    {:ok, project} = Project.get(:system, id: old_contributor.project_id)
    context = Project.get_access_context(old_contributor.project_id)

    Multi.new()
    |> Multi.update(:old_contributor, fn _ ->
      # downgrade the current contributor to a regular contributor
      Contributor.changeset(old_contributor, %{role: :contributor})
    end)
    |> Multi.update(:new_contributor, fn _ ->
      # upgrade the new contributor to the role of the previous contributor (champion or reviewer)
      Contributor.changeset(new_contributor, %{role: old_contributor.role})
    end)
    |> Multi.run(:update_bindings, fn _, _ -> 
      # increase the access level of the new contributor to the level of the previous contributor
      Access.bind_person(context, new_contributor.person_id, access_level(old_contributor))
    end)
    |> Activities.insert_sync(author.id, :project_contributor_edited, fn changes ->
      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: project.id,
        previous_contributor: serialize_contributor(changes.old_contributor),
        updated_contributor: serialize_contributor(changes.new_contributor)
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:old_contributor)
  end

  # 
  # A simple update means that we are only updating the responsibility, role or the permissions
  # of the contributor. In this case, we only need to update the contributor record and
  # acess level on the binding.
  #
  defp handle_simple_update(author, contributor, attrs) do
    level = access_level(contributor, attrs)
    context = Project.get_access_context(contributor.project_id)
    {:ok, project} = Project.get(:system, id: contributor.project_id)

    Multi.new()
    |> Multi.update(:contributor, fn _ ->
      Contributor.changeset(contributor, attrs)
    end)
    |> Multi.run(:update_bindings, fn _, _ -> 
      Access.bind_person(context, contributor.person_id, level)
    end)
    |> Activities.insert_sync(author.id, :project_contributor_edited, fn changes ->
      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: project.id,
        previous_contributor: serialize_contributor(contributor),
        updated_contributor: serialize_contributor(changes.contributor)
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:contributor)
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

  defp serialize_contributor(contributor) do
    %{
      person_id: contributor.person_id,
      role: Atom.to_string(contributor.role),
      permissions: access_level(contributor),
    }
  end

end
