defmodule Operately.ResourceHubs.Getter do
  import Ecto.Query

  alias Operately.Access.Context
  alias Operately.Repo.Getter, as: BaseGetter

  def get(module, requester, args, auth_source) when auth_source in [:hub, :node, :node_child] do
    args = BaseGetter.GetterArgs.parse(args)

    query = from(r in module, as: :resource, preload: ^args.preload)
    query = BaseGetter.add_where_clauses(query, args.field_matchers)

    case requester do
      :system ->
        BaseGetter.get_for_system(query, :system, args)

      %{} ->
        get_for_person(query, requester.id, args, auth_source)

      requester_id when is_binary(requester_id) ->
        get_for_person(query, requester_id, args, auth_source)

      _ ->
        {:error, :invalid_requester}
    end
  end

  defp get_for_person(query, requester_id, args, auth_source) do
    query =
      build_base_query(query, requester_id, args.required_access_level, auth_source)
      |> group_by([resource: r, person: p], [r.id, p.id])
      |> select([resource: r, binding: b, person: p], {r, max(b.access_level), p})

    case BaseGetter.load(query, args) do
      {:ok, {resource, access_level, requester}} ->
        BaseGetter.process_resource(resource, requester, access_level, args)

      {:error, :not_found} ->
        {:error, :not_found}
    end
  end

  defp build_base_query(query, requester_id, required_access_level, :hub) do
    from([resource: r] in query,
      left_join: project in assoc(r, :project),
      left_join: space in assoc(r, :space),
      join: context in Context,
      on: context.project_id == project.id or context.group_id == space.id,
      join: binding in assoc(context, :bindings),
      as: :binding,
      join: access_group in assoc(binding, :group),
      join: membership in assoc(access_group, :memberships),
      join: person in assoc(membership, :person),
      as: :person,
      where: membership.person_id == ^requester_id,
      where: is_nil(person.suspended_at),
      where: binding.access_level >= ^required_access_level
    )
  end

  defp build_base_query(query, requester_id, required_access_level, :node) do
    from([resource: r] in query,
      join: hub in assoc(r, :resource_hub),
      left_join: project in assoc(hub, :project),
      left_join: space in assoc(hub, :space),
      join: context in Context,
      on: context.project_id == project.id or context.group_id == space.id,
      join: binding in assoc(context, :bindings),
      as: :binding,
      join: access_group in assoc(binding, :group),
      join: membership in assoc(access_group, :memberships),
      join: person in assoc(membership, :person),
      as: :person,
      where: membership.person_id == ^requester_id,
      where: is_nil(person.suspended_at),
      where: binding.access_level >= ^required_access_level
    )
  end

  defp build_base_query(query, requester_id, required_access_level, :node_child) do
    from([resource: r] in query,
      join: node in assoc(r, :node),
      join: hub in assoc(node, :resource_hub),
      left_join: project in assoc(hub, :project),
      left_join: space in assoc(hub, :space),
      join: context in Context,
      on: context.project_id == project.id or context.group_id == space.id,
      join: binding in assoc(context, :bindings),
      as: :binding,
      join: access_group in assoc(binding, :group),
      join: membership in assoc(access_group, :memberships),
      join: person in assoc(membership, :person),
      as: :person,
      where: membership.person_id == ^requester_id,
      where: is_nil(person.suspended_at),
      where: binding.access_level >= ^required_access_level
    )
  end
end
