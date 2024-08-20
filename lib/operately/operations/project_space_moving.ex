defmodule Operately.Operations.ProjectSpaceMoving do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Activities
  alias Operately.Projects.Project

  def run(author, project, space_id) do
    Multi.new()
    |> Multi.update(:project, Project.changeset(project, %{group_id: space_id}))
    |> Multi.run(:context, fn _, _ ->
      {:ok, Access.get_context!(project_id: project.id)}
    end)
    |> delete_old_binding(project.group_id)
    |> insert_new_binding(space_id)
    |> insert_activity(author, project)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end

  defp delete_old_binding(multi, space_id) do
    group = Access.get_group!(group_id: space_id, tag: :standard)

    multi
    |> Multi.run(:old_members_binding, fn _, %{context: context} ->
      case Access.get_binding(context_id: context.id, group_id: group.id) do
        nil -> {:ok, nil}
        binding -> Access.delete_binding(binding)
      end
    end)
  end

  defp insert_new_binding(multi, space_id) do
    group = Access.get_group!(group_id: space_id, tag: :standard)

    multi
    |> Multi.run(:new_members_binding, fn _, changes ->
      access_level = find_access_level(changes.old_members_binding)
      attrs = [context_id: changes.context.id, group_id: group.id]

      case Access.get_binding(attrs) do
        nil -> Access.create_binding(Enum.into(attrs, %{access_level: access_level}))
        binding -> Access.update_binding(binding, %{access_level: access_level})
      end
    end)
  end

  defp insert_activity(multi, author, project) do
    Activities.insert_sync(multi, author.id, :project_moved, fn changes -> %{
      company_id: project.company_id,
      project_id: project.id,
      old_space_id: project.group_id,
      new_space_id: changes.project.group_id
    } end)
  end

  #
  # Helpers
  #

  defp find_access_level(binding) do
    case binding do
      nil -> Binding.no_access()
      binding -> binding.access_level
    end
  end
end
