defmodule Operately.Data.Change021CreateProjectBindingsToCompanyAndSpace do
  import Ecto.Query, only: [from: 1]

  alias Operately.Repo
  alias Operately.Projects.Project
  alias Operately.Access
  alias Operately.Access.Binding

  def run do
    Repo.transaction(fn ->
      projects = from(p in Project) |> Repo.all()

      Enum.each(projects, fn project ->
        context = Access.get_context!(project_id: project.id)

        create_bindings_to_company(context, project.company_id)
        create_bindings_to_space(context, project)
      end)
    end)
  end

  defp create_bindings_to_company(context, company_id) do
    full_access = Access.get_group!(company_id: company_id, tag: :full_access)
    standard = Access.get_group!(company_id: company_id, tag: :standard)

    create_binding(context.id, full_access.id, Binding.full_access())
    create_binding(context.id, standard.id, Binding.edit_access())
  end

  defp create_bindings_to_space(context, project) do
    full_access = Access.get_group!(group_id: project.group_id, tag: :full_access)
    standard = Access.get_group!(group_id: project.group_id, tag: :standard)

    create_binding(context.id, full_access.id, Binding.full_access())
    create_binding(context.id, standard.id, Binding.edit_access())
  end

  defp create_binding(context_id, group_id, access_level) do
    case Access.get_binding(context_id: context_id, group_id: group_id) do
      nil ->
        Access.create_binding(%{
          context_id: context_id,
          group_id: group_id,
          access_level: access_level,
        })
      _ ->
        :ok
    end
  end
end
