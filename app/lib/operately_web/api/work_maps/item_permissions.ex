defmodule OperatelyWeb.Api.WorkMaps.ItemPermissions do
  import Ecto.Query
  alias Operately.Access.{Binding, Fetch}
  alias Operately.{Goals.Goal, Projects.Project, Repo}
  alias OperatelyWeb.Api.WorkMaps

  def read(_scope, true), do: %{reparentable: [], reviewer_editable: []}

  def read(scope, false) do
    items = editable_items(Goal, scope) ++ editable_items(Project, scope)

    %{
      reparentable: if(scope.can_edit, do: Enum.map(items, &elem(&1, 0)), else: []),
      reviewer_editable: for({id, level} <- items, level >= Binding.full_access(), do: id)
    }
  end

  defp editable_items(schema, scope) do
    query = from r in schema, as: :resource, where: r.company_id == ^scope.person.company_id
    query = if scope.space_id, do: where(query, [r], r.group_id == ^scope.space_id), else: query

    query
    |> Fetch.join_access_level(scope.person.id)
    |> where([binding: b], b.access_level >= ^Binding.edit_access())
    |> group_by([r], r.id)
    |> select([r, binding: b], {struct(r, [:id, :name]), max(b.access_level)})
    |> Repo.all()
    |> Enum.map(fn {item, level} -> {WorkMaps.item_id(item), level} end)
  end
end
