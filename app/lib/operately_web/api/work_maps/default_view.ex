defmodule OperatelyWeb.Api.WorkMaps.DefaultView do
  import Ecto.Query

  alias Operately.Access.Filters
  alias Operately.Groups.Group
  alias Operately.People.Person
  alias Operately.{Repo, ShortUuid}
  alias OperatelyWeb.Api.Types.Id

  @doc "Hides inaccessible spaces and champions in a stored view. JSON from storage has string keys."
  def for_read(%{"filters" => filters} = view, scope) do
    %{view | "filters" => Enum.map(filters, &visible_filter(&1, scope))}
  end

  def for_read(view, _scope), do: view

  defp visible_filter(%{"field" => field, "values" => values} = filter, scope) when field in ["space", "champion"] do
    %{filter | "values" => visible_reference_ids(field, values, scope)}
  end

  defp visible_filter(filter, _scope), do: filter

  @doc "Validates a submitted view and normalizes its reference IDs. A nil view resets the default."
  def for_save(nil, _scope), do: nil

  def for_save(view, scope) do
    if nil in Map.get(view, :columns, []), do: Repo.rollback(:bad_request)

    case view do
      %{filters: filters} -> %{view | filters: Enum.map(filters, &validate_filter(&1, scope))}
      _ -> view
    end
  end

  defp validate_filter(%{field: field, operator: _, values: values} = filter, scope) when is_list(values) do
    unless Enum.all?(values, &is_binary/1), do: Repo.rollback(:bad_request)

    if field in [:space, :champion] do
      visible_ids = visible_reference_ids(Atom.to_string(field), values, scope)
      if length(visible_ids) != length(values), do: Repo.rollback(:bad_request)
      %{filter | values: visible_ids}
    else
      filter
    end
  end

  defp validate_filter(_, _scope), do: Repo.rollback(:bad_request)

  defp visible_reference_ids(_field, [], _scope), do: []

  defp visible_reference_ids(field, values, scope) do
    decoded = Enum.map(values, &Id.decode/1)
    ids = for {:ok, id} <- decoded, is_binary(id), do: id

    visible_ids =
      field
      |> reference_query(scope.space_id)
      |> where([r], r.company_id == ^scope.person.company_id and r.id in ^ids)
      |> Filters.filter_by_view_access(scope.person.id)
      |> select([r], r.id)
      |> Repo.all()
      |> MapSet.new()

    for id <- ids, MapSet.member?(visible_ids, id), do: ShortUuid.encode!(id)
  end

  defp reference_query("champion", _space_id), do: Person
  defp reference_query("space", nil), do: Group
  defp reference_query("space", space_id), do: from(space in Group, where: space.id == ^space_id)
end
