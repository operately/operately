defmodule Operately.Operations.ProjectSpaceMoving do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Activities
  alias Operately.Projects.Project

  def run(author, project, space_id) do
    context = Access.get_context!(project_id: project.id)

    Multi.new()
    |> Multi.update(:project, Project.changeset(project, %{group_id: space_id}))
    |> Multi.run(:context, fn _, _ -> {:ok, context} end)
    |> update_bindings(context, project, space_id)
    |> insert_activity(author, project)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end

  defp insert_activity(multi, author, project) do
    Activities.insert_sync(multi, author.id, :project_moved, fn changes -> %{
      company_id: project.company_id,
      project_id: project.id,
      old_space_id: project.group_id,
      new_space_id: changes.project.group_id
    } end)
  end

  defp update_bindings(multi, context, project, new_space_id) do
    company_space_id = Repo.one!(from(c in Operately.Companies.Company, where: c.id == ^project.company_id, select: c.company_space_id))
    previous_space_id = project.group_id

    binding = get_current_binding(context, previous_space_id, company_space_id)

    multi
    |> maybe_delete_binding_to_space(binding)
    |> maybe_update_binding_to_space(new_space_id, company_space_id, get_current_access_level(binding))
  end

  defp maybe_update_binding_to_space(multi, space_id, company_space_id, access_level) do
    if space_id != company_space_id do
      Access.update_bindings_to_space(multi, space_id, access_level)
    else
      multi
    end
  end

  defp maybe_delete_binding_to_space(multi, binding) do
    if binding do
      Multi.delete(multi, :deleted_space_binding, binding)
    else
      multi
    end
  end

  defp get_current_binding(context, space_id, company_space_id) do
    if space_id != company_space_id do
      group = Access.get_group!(group_id: space_id, tag: :standard)
      Access.get_binding!(context_id: context.id, group_id: group.id)
    end
  end

  defp get_current_access_level(binding) do
    case binding do
      nil -> Binding.no_access()
      binding -> binding.access_level
    end
  end
end
