defmodule Operately.Data.Change020CreateProjectContributorsBindings do
  import Ecto.Query, only: [from: 1]

  alias Operately.Repo
  alias Operately.Projects
  alias Operately.Access
  alias Operately.Access.Binding

  def run do
    Repo.transaction(fn ->
      projects = from(p in Projects.Project) |> Repo.all()

      Enum.each(projects, fn project ->
        create_bindings(project)
      end)
    end)
  end

  defp create_bindings(project) do
    context = Access.get_context!(project_id: project.id)
    contributors = Projects.list_project_contributors(project)

    Enum.each(contributors, fn contributor ->
      group = Access.get_group!(person_id: contributor.person_id)
      access_level = get_access_level(contributor.role)

      create_binding(context, group, access_level)
    end)
  end

  defp create_binding(context, group, access_level) do
    case Access.get_binding(context_id: context.id, group_id: group.id) do
      nil ->
        Access.create_binding(%{
          context_id: context.id,
          group_id: group.id,
          access_level: access_level,
        })
      _ ->
        :ok
    end
  end

  defp get_access_level(role) do
    case role do
      :champion -> Binding.full_access()
      :reviewer -> Binding.full_access()
      :contributor -> Binding.edit_access()
    end
  end
end
