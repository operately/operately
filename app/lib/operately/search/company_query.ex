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
  alias Operately.Search.{Entry, FullTextQuery, Text}
  alias Operately.Search.CompanyQuery.{CoreWorkItems, Filters, ResourceHubItems, ResultBuilder}

  @limit 30
  @candidates_cte "company_search_candidates"
  @state_validated_types ["milestone", "task", "project_check_in", "goal_check_in", "project_retrospective"]
  # Title-only matches fall back to MinWords when the query is absent from the body.
  # Keep MinWords just below MaxWords (PostgreSQL requires MinWords < MaxWords) so
  # title and body excerpts stay roughly the same length.
  @snippet_min_words 39
  @snippet_max_words 40

  def search(%Person{} = person, query, filters \\ %{}) do
    with nil <- person.suspended_at,
         {:ok, normalized_query} <- Text.prepare_query(query) do
      search_company(person, normalized_query, Filters.normalize(filters))
    else
      _ -> []
    end
  end

  defp search_company(person, normalized_query, filters) do
    person.company_id
    |> candidate_query(person.id, normalized_query, filters)
    |> Repo.all()
    |> ResultBuilder.build()
  end

  defp candidate_query(company_id, person_id, query, filters) do
    full_text = FullTextQuery.build(query)
    accessible_contexts = accessible_contexts_query(person_id)
    eligible_items = eligible_items_query(company_id)
    candidates = matched_candidates_query(company_id, eligible_items, accessible_contexts, full_text, filters)
    candidate_ancestors = candidate_ancestors_query()
    candidate_ancestors_cte = ResourceHubItems.candidate_ancestors_cte()
    snippet_options =
      "StartSel=#{ResultBuilder.snippet_start()}, StopSel=#{ResultBuilder.snippet_stop()}, MaxFragments=1, MinWords=#{@snippet_min_words}, MaxWords=#{@snippet_max_words}, ShortWord=2"

    from(candidate in @candidates_cte,
      join: entry in Entry,
      as: :entry,
      on: entry.id == candidate.entry_id,
      left_join: ancestor in ^candidate_ancestors_cte,
      on: ancestor.entry_id == candidate.entry_id,
      where:
        is_nil(candidate.resource_hub_id) or
          (not is_nil(ancestor.entry_id) and is_nil(ancestor.parent_folder_id)),
      select: %{
        source_id: entry.source_id,
        source_type: entry.source_type,
        resource_hub_id: entry.resource_hub_id,
        source_space_id: type(candidate.space_id, :binary_id),
        source_project_id: type(candidate.project_id, :binary_id),
        source_goal_id: type(candidate.goal_id, :binary_id),
        title: entry.title,
        body: entry.body,
        body_kind: entry.body_kind,
        state: entry.state,
        source_inserted_at: entry.source_inserted_at,
        owner_name: candidate.owner_name,
        exact_title: entry.normalized_title == ^full_text.normalized_title,
        # True when the query is eligible for prefix matching and the normalized title starts with it.
        prefix_title:
          fragment(
            "? AND ? LIKE ? ESCAPE '!'",
            ^full_text.title_prefix?,
            entry.normalized_title,
            ^full_text.title_prefix
          ),
        # True when the title itself matches the full-text query (prefix or websearch form).
        title_match:
          fragment(
            "to_tsvector('public.operately'::regconfig, coalesce(?, '')) @@ (CASE WHEN ? THEN to_tsquery('public.operately'::regconfig, ?) ELSE websearch_to_tsquery('public.operately'::regconfig, ?) END)",
            entry.title,
            ^full_text.use_prefix?,
            ^full_text.tsquery_expr,
            ^full_text.websearch_expr
          ),
        # Empty bodies stay null; otherwise build a short plain-text excerpt via ts_headline.
        body_snippet:
          fragment(
            "CASE WHEN coalesce(?, '') = '' THEN NULL ELSE ts_headline('public.operately'::regconfig, ?, CASE WHEN ? THEN to_tsquery('public.operately'::regconfig, ?) ELSE websearch_to_tsquery('public.operately'::regconfig, ?) END, ?) END",
            entry.body,
            entry.body,
            ^full_text.use_prefix?,
            ^full_text.tsquery_expr,
            ^full_text.websearch_expr,
            ^snippet_options
          )
      },
      order_by: ^Filters.order_by(filters, full_text),
      limit: @limit
    )
    |> recursive_ctes(true)
    |> with_cte(@candidates_cte, as: ^candidates, materialized: true)
    |> with_cte(^candidate_ancestors_cte, as: ^candidate_ancestors)
  end

  defp eligible_items_query(company_id) do
    resource_hub_items = ResourceHubItems.query(company_id)
    core_work_items = CoreWorkItems.query(company_id)

    resource_hub_items
    |> union_all(^core_work_items)
  end

  defp matched_candidates_query(company_id, eligible_items, accessible_contexts, full_text, filters) do
    from(entry in Entry,
      as: :entry,
      join: item in subquery(eligible_items),
      on: item.source_id == entry.source_id and item.source_type == entry.source_type,
      join: accessible_context in subquery(accessible_contexts),
      on: accessible_context.id == entry.access_context_id,
      where: entry.company_id == ^company_id,
      where: entry.company_id == item.company_id,
      where: fragment("? IS NOT DISTINCT FROM ?", entry.resource_hub_id, item.resource_hub_id),
      where: entry.access_context_id == item.access_context_id,
      where: fragment("? IS NOT DISTINCT FROM ?", entry.space_id, item.space_id),
      where: fragment("? IS NOT DISTINCT FROM ?", entry.project_id, item.project_id),
      where: fragment("? IS NOT DISTINCT FROM ?", entry.goal_id, item.goal_id),
      # Reject stale parent-owned entries whose indexed inherited state no longer
      # matches the live project/goal.
      where:
        item.source_type not in ^@state_validated_types or
          fragment("? IS NOT DISTINCT FROM ?", entry.state, item.expected_state),
      where: ^FullTextQuery.match_dynamic(full_text),
      select: %{
        entry_id: entry.id,
        resource_hub_id: item.resource_hub_id,
        parent_folder_id: item.parent_folder_id,
        owner_name: item.owner_name,
        space_id: item.space_id,
        project_id: item.project_id,
        goal_id: item.goal_id
      }
    )
    |> Filters.apply(filters)
  end

  defp candidate_ancestors_query do
    candidates =
      from(candidate in @candidates_cte,
        where: not is_nil(candidate.resource_hub_id),
        select: %{
          entry_id: type(candidate.entry_id, :binary_id),
          resource_hub_id: type(candidate.resource_hub_id, :binary_id),
          parent_folder_id: type(candidate.parent_folder_id, :binary_id)
        }
      )

    ResourceHubItems.ancestor_paths_query(candidates)
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
end
