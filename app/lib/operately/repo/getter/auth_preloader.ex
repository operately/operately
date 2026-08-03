defmodule Operately.Repo.Getter.AuthPreloader do
  import Ecto.Query

  alias Operately.Access.Binding
  alias Operately.Repo
  alias Operately.Repo.Getter.AccessQuery
  alias Operately.Repo.Getter.Association
  alias Operately.Repo.Getter.Profile

  def ordinary_preloads(preload, auth_preload) when auth_preload in [nil, []], do: preload

  def ordinary_preloads(preload, auth_preload) do
    auth_associations = auth_preload_associations(auth_preload)

    preload
    |> List.wrap()
    |> List.flatten()
    |> Enum.reject(&preload_association_in?(&1, auth_associations))
  end

  def preload(resource, _requester, %{auth_preload: auth_preload}) when auth_preload in [nil, []], do: resource

  def preload(resource, :system, %{auth_preload: auth_preload, with_deleted: with_deleted}) do
    Repo.preload(resource, List.wrap(auth_preload) |> List.flatten(), with_deleted: with_deleted)
  end

  def preload(resource, requester, %{auth_preload: auth_preload, with_deleted: with_deleted}) do
    requester_id = requester_id(requester)

    if requester_id do
      preload = build(resource.__struct__, requester_id, auth_preload)
      Repo.preload(resource, preload, with_deleted: with_deleted)
    else
      resource
    end
  end

  defp auth_preload_associations(auth_preload) do
    auth_preload
    |> List.wrap()
    |> List.flatten()
    |> Enum.map(&preload_association_name/1)
    |> Enum.reject(&is_nil/1)
    |> MapSet.new()
  end

  defp preload_association_in?(item, associations) do
    case preload_association_name(item) do
      nil -> false
      association -> MapSet.member?(associations, association)
    end
  end

  defp preload_association_name({association, _}) when is_atom(association), do: association
  defp preload_association_name(association) when is_atom(association), do: association
  defp preload_association_name(_), do: nil

  defp requester_id(%{id: id}), do: id
  defp requester_id(id) when is_binary(id), do: id
  defp requester_id(_), do: nil

  defp build(module, requester_id, auth_preload) do
    auth_preload
    |> List.wrap()
    |> List.flatten()
    |> Enum.map(&build_item(module, requester_id, &1))
    |> merge_items()
  end

  defp build_item(module, requester_id, {association, {query, nested}}) do
    {association, {auth_query(module, association, requester_id, query), normalize_nested_preload(nested)}}
  end

  defp build_item(module, requester_id, {association, %Ecto.Query{} = query}) do
    {association, auth_query(module, association, requester_id, query)}
  end

  defp build_item(module, requester_id, {association, %Ecto.SubQuery{} = query}) do
    {association, auth_query(module, association, requester_id, query)}
  end

  defp build_item(module, requester_id, {association, nested}) do
    {association, {auth_query(module, association, requester_id), normalize_nested_preload(nested)}}
  end

  defp build_item(module, requester_id, association) when is_atom(association) do
    {association, auth_query(module, association, requester_id)}
  end

  defp merge_items(items) do
    items
    |> Enum.reduce(%{}, fn item, acc ->
      {association, query, nested} = normalize_item(item)

      Map.update(acc, association, {query, List.wrap(nested)}, fn {existing_query, existing_nested} ->
        {existing_query || query, merge_nested_preloads(existing_nested, nested)}
      end)
    end)
    |> Enum.map(fn {association, {query, nested}} ->
      if nested == [] do
        {association, query}
      else
        {association, {query, nested}}
      end
    end)
  end

  defp normalize_item({association, {query, nested}}), do: {association, query, normalize_nested_preload(nested)}
  defp normalize_item({association, query}), do: {association, query, []}

  defp merge_nested_preloads(existing, nested) do
    existing = List.wrap(existing)
    nested = List.wrap(nested)

    Enum.uniq(existing ++ nested)
  end

  defp normalize_nested_preload(nil), do: []
  defp normalize_nested_preload(nested), do: nested

  defp auth_query(module, association, requester_id, query \\ nil) do
    association_module = Association.related_module!(module, association)
    profile = Profile.resolve!(association_module, :default)

    (query || association_module)
    |> Ecto.Queryable.to_query()
    |> ensure_resource_binding()
    |> Profile.apply_scope!(association_module, :default, profile)
    |> AccessQuery.authorize(requester_id, Binding.view_access(), profile.access_contexts)
    |> distinct([resource: resource], resource.id)
  end

  defp ensure_resource_binding(query) do
    from(resource in query, as: :resource)
  end
end
