defmodule Operately.Data.Change024RemovePrivateProjectsBindings do
  import Ecto.Query, only: [from: 2]

  alias Operately.{Repo, Access}
  alias Operately.Access.Binding
  alias Operately.Projects.Project

  def run do
    Repo.transaction(fn ->
      from(p in Project, where: p.private, preload: :access_context)
      |> Repo.all()
      |> remove_bindings()
    end)
  end

  defp remove_bindings(projects) when is_list(projects) do
    Enum.each(projects, fn p ->
      remove_bindings(p)
    end)
  end

  defp remove_bindings(%{access_context: context, company_id: company_id, group_id: space_id}) do
    fetch_groups(company_id, space_id)
    |> Enum.each(fn g ->
      remove_binding(context.id, g.id)
    end)
  end

  defp remove_binding(context_id, group_id) do
    case Access.get_binding(context_id: context_id, group_id: group_id) do
      nil -> :ok
      binding ->
        Access.update_binding(binding, %{access_level: Binding.no_access()})
    end
  end

  defp fetch_groups(company_id, space_id) do
    [
      Access.get_group!(company_id: company_id, tag: :anonymous),
      Access.get_group!(company_id: company_id, tag: :standard),
      Access.get_group!(group_id: space_id, tag: :standard),
    ]
  end
end
