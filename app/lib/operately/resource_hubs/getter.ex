defmodule Operately.ResourceHubs.Getter do
  import Ecto.Query

  alias Operately.Access.Context
  alias Operately.Repo.Getter, as: BaseGetter

  @parent_space_hub_names ["Documents & Files", "Docs & Files"]

  defmacro __using__(opts) do
    source = Keyword.fetch!(opts, :source)

    quote do
      alias Operately.Repo
      import Ecto.Query, only: [from: 2]
      import Operately.Repo.RequestInfo, only: [request_info: 0]

      def get(requester, args) do
        Operately.ResourceHubs.Getter.get(__MODULE__, unquote(source), requester, args)
      end

      def get!(requester, args) do
        case Operately.ResourceHubs.Getter.get(__MODULE__, unquote(source), requester, args) do
          {:ok, resource} -> resource
          {:error, :not_found} -> raise Ecto.NoResultsError, queryable: __MODULE__
          {:error, reason} -> raise "Failed to get #{__MODULE__}: #{inspect(reason)}"
        end
      end
    end
  end

  def parent_space_hub_names, do: @parent_space_hub_names

  def get(module, source, requester, args) do
    args = BaseGetter.GetterArgs.parse(args)

    query = from(r in module, as: :resource, preload: ^args.preload)
    query = BaseGetter.add_where_clauses(query, args.field_matchers)

    case requester do
      :system -> BaseGetter.get_for_system(query, :system, args)
      %{} -> get_for_person(query, source, requester.id, args)
      requester_id when is_binary(requester_id) -> get_for_person(query, source, requester_id, args)
      _ -> {:error, :invalid_requester}
    end
  end

  def join_effective_context(query, source) do
    query
    |> join_resource_hub(source)
    |> join_context(source)
  end

  defp get_for_person(query, source, requester_id, args) do
    query =
      query
      |> base_query(source, requester_id, args.required_access_level)
      |> group_by([resource: r, person: p, context: c], [r.id, p.id, c.id])
      |> select([resource: r, binding: b, person: p, context: c], {r, max(b.access_level), p, c})

    case BaseGetter.load(query, args) do
      {:ok, {resource, access_level, requester, context}} ->
        resource = Map.put(resource, :access_context, context)
        BaseGetter.process_resource(resource, requester, access_level, args)

      {:error, :not_found} ->
        {:error, :not_found}
    end
  end

  defp base_query(query, source, requester_id, required_access_level) do
    query
    |> join_effective_context(source)
    |> join_access_graph(requester_id, required_access_level)
  end

  defp join_resource_hub(query, :hub), do: query

  defp join_resource_hub(query, :node) do
    from([resource: r] in query, join: h in assoc(r, :resource_hub), as: :resource_hub)
  end

  defp join_resource_hub(query, :child) do
    from([resource: r] in query,
      join: n in assoc(r, :node),
      join: h in assoc(n, :resource_hub),
      as: :resource_hub
    )
  end

  defp join_context(query, :hub) do
    from([resource: r] in query,
      join: c in Context,
      as: :context,
      on:
        (not is_nil(r.project_id) and c.project_id == r.project_id) or
          (is_nil(r.project_id) and r.name in ^@parent_space_hub_names and c.group_id == r.space_id) or
          (is_nil(r.project_id) and r.name not in ^@parent_space_hub_names and c.resource_hub_id == r.id)
    )
  end

  defp join_context(query, _source) do
    from([resource_hub: h] in query,
      join: c in Context,
      as: :context,
      on:
        (not is_nil(h.project_id) and c.project_id == h.project_id) or
          (is_nil(h.project_id) and h.name in ^@parent_space_hub_names and c.group_id == h.space_id) or
          (is_nil(h.project_id) and h.name not in ^@parent_space_hub_names and c.resource_hub_id == h.id)
    )
  end

  defp join_access_graph(query, requester_id, required_access_level) do
    from([context: c] in query,
      join: b in assoc(c, :bindings),
      as: :binding,
      join: g in assoc(b, :group),
      join: m in assoc(g, :memberships),
      join: p in assoc(m, :person),
      as: :person,
      where: m.person_id == ^requester_id,
      where: is_nil(p.suspended_at),
      where: b.access_level >= ^required_access_level
    )
  end
end
