defmodule Operately.Search.CompanyQuery do
  @moduledoc """
  Runs permission-aware full-text search across one authenticated company.

  Candidate rows are validated against current source records and live access
  bindings before PostgreSQL ranks or limits them. Resource-specific eligibility
  and result construction live in focused modules so more source families can be
  added without turning this query into one large resource switch.
  """

  import Ecto.Query

  alias Operately.Access.{Binding, Context}
  alias Operately.People.Person
  alias Operately.Repo
  alias Operately.Search.{Entry, Text}
  alias Operately.Search.CompanyQuery.{ResourceHubItems, ResultBuilder}

  @limit 30

  def search(%Person{} = person, query) do
    normalized_query = Text.normalize_query(query)

    if person.suspended_at || String.length(Text.normalize_title(normalized_query)) < 2 do
      []
    else
      person.company_id
      |> candidate_query(person.id, normalized_query)
      |> Repo.all()
      |> ResultBuilder.build()
    end
  end

  defp candidate_query(company_id, person_id, query) do
    normalized_title = Text.normalize_title(query)
    title_prefix = title_prefix_pattern(normalized_title)
    {use_prefix?, tsquery_expr, websearch_expr} = tsquery_args(query)
    eligible_items = ResourceHubItems.query(company_id)
    visible_nodes = ResourceHubItems.visible_nodes_query(company_id)
    accessible_contexts = accessible_contexts_query(person_id)
    visible_nodes_cte = ResourceHubItems.visible_nodes_cte()
    snippet_options = "StartSel=#{ResultBuilder.snippet_start()}, StopSel=#{ResultBuilder.snippet_stop()}, MaxFragments=1, MinWords=8, MaxWords=22, ShortWord=2"

    from(entry in Entry,
      as: :entry,
      join: item in subquery(eligible_items),
      on: item.source_id == entry.source_id and item.source_type == entry.source_type,
      join: visible_node in ^visible_nodes_cte,
      on: visible_node.node_id == item.node_id,
      join: accessible_context in subquery(accessible_contexts),
      on: accessible_context.id == entry.access_context_id,
      where: entry.company_id == ^company_id,
      where: entry.company_id == item.company_id,
      where: entry.resource_hub_id == item.resource_hub_id,
      where: entry.access_context_id == item.access_context_id,
      where: fragment("? IS NOT DISTINCT FROM ?", entry.space_id, item.space_id),
      where: fragment("? IS NOT DISTINCT FROM ?", entry.project_id, item.project_id),
      where: fragment("? IS NOT DISTINCT FROM ?", entry.goal_id, item.goal_id),
      where:
        fragment(
          "? @@ (CASE WHEN ? THEN to_tsquery('public.operately'::regconfig, ?) ELSE websearch_to_tsquery('public.operately'::regconfig, ?) END)",
          field(entry, :search_vector),
          ^use_prefix?,
          ^tsquery_expr,
          ^websearch_expr
        ) or fragment("? LIKE ? ESCAPE '!'", entry.normalized_title, ^title_prefix),
      select: %{
        source_id: entry.source_id,
        source_type: entry.source_type,
        resource_hub_id: entry.resource_hub_id,
        title: entry.title,
        body_kind: entry.body_kind,
        state: entry.state,
        owner_name: item.owner_name,
        exact_title: entry.normalized_title == ^normalized_title,
        prefix_title: fragment("? LIKE ? ESCAPE '!'", entry.normalized_title, ^title_prefix),
        title_match:
          fragment(
            "to_tsvector('public.operately'::regconfig, coalesce(?, '')) @@ (CASE WHEN ? THEN to_tsquery('public.operately'::regconfig, ?) ELSE websearch_to_tsquery('public.operately'::regconfig, ?) END)",
            entry.title,
            ^use_prefix?,
            ^tsquery_expr,
            ^websearch_expr
          ),
        title_rank:
          fragment(
            "ts_rank_cd(to_tsvector('public.operately'::regconfig, coalesce(?, '')), CASE WHEN ? THEN to_tsquery('public.operately'::regconfig, ?) ELSE websearch_to_tsquery('public.operately'::regconfig, ?) END)",
            entry.title,
            ^use_prefix?,
            ^tsquery_expr,
            ^websearch_expr
          ),
        body_rank:
          fragment(
            "ts_rank_cd(to_tsvector('public.operately'::regconfig, coalesce(?, '')), CASE WHEN ? THEN to_tsquery('public.operately'::regconfig, ?) ELSE websearch_to_tsquery('public.operately'::regconfig, ?) END)",
            entry.body,
            ^use_prefix?,
            ^tsquery_expr,
            ^websearch_expr
          ),
        body_snippet:
          fragment(
            "ts_headline('public.operately'::regconfig, coalesce(?, ''), CASE WHEN ? THEN to_tsquery('public.operately'::regconfig, ?) ELSE websearch_to_tsquery('public.operately'::regconfig, ?) END, ?)",
            entry.body,
            ^use_prefix?,
            ^tsquery_expr,
            ^websearch_expr,
            ^snippet_options
          )
      },
      order_by: [
        desc: entry.normalized_title == ^normalized_title,
        desc: fragment("? LIKE ? ESCAPE '!'", entry.normalized_title, ^title_prefix),
        desc:
          fragment(
            "ts_rank_cd(to_tsvector('public.operately'::regconfig, coalesce(?, '')), CASE WHEN ? THEN to_tsquery('public.operately'::regconfig, ?) ELSE websearch_to_tsquery('public.operately'::regconfig, ?) END)",
            entry.title,
            ^use_prefix?,
            ^tsquery_expr,
            ^websearch_expr
          ),
        desc:
          fragment(
            "ts_rank_cd(to_tsvector('public.operately'::regconfig, coalesce(?, '')), CASE WHEN ? THEN to_tsquery('public.operately'::regconfig, ?) ELSE websearch_to_tsquery('public.operately'::regconfig, ?) END)",
            entry.body,
            ^use_prefix?,
            ^tsquery_expr,
            ^websearch_expr
          ),
        asc: entry.source_id
      ],
      limit: @limit
    )
    |> recursive_ctes(true)
    |> with_cte(^visible_nodes_cte, as: ^visible_nodes)
  end

  defp accessible_contexts_query(person_id) do
    from(context in Context,
      join: binding in assoc(context, :bindings),
      join: group in assoc(binding, :group),
      join: membership in assoc(group, :memberships),
      join: person in assoc(membership, :person),
      where: membership.person_id == ^person_id,
      where: binding.access_level >= ^Binding.view_access(),
      where: is_nil(person.suspended_at),
      select: %{id: context.id},
      distinct: true
    )
  end

  defp tsquery_args(query) do
    case Text.search_tsquery(query) do
      {:prefix, tsquery} -> {true, tsquery, query}
      {:websearch, websearch_query} -> {false, "", websearch_query}
    end
  end

  defp title_prefix_pattern(title) do
    title
    |> String.replace("!", "!!")
    |> String.replace("%", "!%")
    |> String.replace("_", "!_")
    |> Kernel.<>("%")
  end
end
