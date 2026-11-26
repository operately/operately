defmodule Operately.Kpis.GoalLinks do
  import Ecto.Query
  alias Operately.Access.{Binding, Filters}
  alias Operately.Goals.Goal
  alias Operately.Groups.Group
  alias Operately.Kpis.Kpi
  alias Operately.Repo

  defmodule Item do
    def __api_typename__, do: "kpi_goal_link_item"
    defstruct [:resource, can_unlink: false]
  end

  def visible_goal(person, id), do: Goal.get(person, id: id, company_id: person.company_id)

  def visible_kpi(person, id) do
    with {:ok, kpi} <- Kpi.get(person, id: id, opts: [preload: [:space]]),
         %{company_id: company_id} when company_id == person.company_id <- kpi.space do
      {:ok, kpi}
    else
      _ -> {:error, :not_found}
    end
  end

  def linked_kpis(person, goal, read_only) do
    Kpi.list(person, goal_id: goal.id, opts: [preload: [:space], order_by: [asc: :name, asc: :id]])
    |> Enum.filter(&(&1.space && &1.space.company_id == person.company_id))
    |> Enum.map(&%Item{resource: &1, can_unlink: can_edit_kpi?(&1, read_only)})
  end

  def linked_goal(_person, %Kpi{goal_id: nil}, _read_only), do: nil

  def linked_goal(person, kpi, read_only) do
    case Goal.get(person, id: kpi.goal_id, company_id: person.company_id, opts: [auth_preload: [:group]]) do
      {:ok, goal} -> %Item{resource: goal, can_unlink: can_edit_kpi?(kpi, read_only)}
      {:error, :not_found} -> nil
    end
  end

  def can_edit_kpi?(kpi, read_only), do: not read_only and kpi.request_info.access_level >= Binding.edit_access()

  def available_kpis(person) do
    from(k in Kpi, join: s in assoc(k, :space), as: :space, preload: [space: s], where: s.company_id == ^person.company_id and is_nil(s.deleted_at) and is_nil(k.goal_id))
    |> Filters.filter_by_edit_access(person.id, named_binding: :space)
  end

  def available_goals(person) do
    visible_spaces = Filters.filter_by_view_access(Group, person.id)

    from(g in Goal, where: g.company_id == ^person.company_id, preload: [group: ^visible_spaces])
    |> Filters.filter_by_view_access(person.id)
  end

  def search(query, text) do
    term = String.trim(text)

    query
    |> where([r], fragment("strpos(lower(?), lower(?)) > 0", r.name, ^term))
    |> order_by([r], [r.name, r.id])
    |> limit(50)
    |> Repo.all()
    |> Enum.map(&%Item{resource: &1})
  end

end
