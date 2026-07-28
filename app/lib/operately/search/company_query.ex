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
  alias Operately.Search.CompanyQuery.{ResourceHubItems, ResultBuilder}

  @limit 30
  @candidates_cte "company_search_candidates"

  def search(%Person{} = person, query) do
    with nil <- person.suspended_at,
         {:ok, normalized_query} <- Text.prepare_query(query) do
      search_company(person, normalized_query)
    else
      _ -> []
    end
  end

  defp search_company(person, normalized_query) do
    person.company_id
    |> candidate_query(person.id, normalized_query)
    |> Repo.all()
    |> ResultBuilder.build()
  end

  defp candidate_query(company_id, person_id, query) do
    full_text = FullTextQuery.build(query)
    accessible_contexts = accessible_contexts_query(person_id)
    eligible_items = ResourceHubItems.query(company_id)
    candidates = matched_candidates_query(company_id, eligible_items, accessible_contexts, full_text)
    candidate_ancestors = candidate_ancestors_query()
    candidate_ancestors_cte = ResourceHubItems.candidate_ancestors_cte()
    snippet_options = "StartSel=#{ResultBuilder.snippet_start()}, StopSel=#{ResultBuilder.snippet_stop()}, MaxFragments=1, MinWords=8, MaxWords=22, ShortWord=2"

    from(candidate in @candidates_cte,
      join: entry in Entry,
      as: :entry,
      on: entry.id == candidate.entry_id,
      join: ancestor in ^candidate_ancestors_cte,
      on: ancestor.entry_id == candidate.entry_id,
      where: is_nil(ancestor.parent_folder_id),
      select: %{
        source_id: entry.source_id,
        source_type: entry.source_type,
        resource_hub_id: entry.resource_hub_id,
        title: entry.title,
        body_kind: entry.body_kind,
        state: entry.state,
        owner_name: candidate.owner_name,
        exact_title: entry.normalized_title == ^full_text.normalized_title,
        prefix_title:
          fragment(
            "? AND ? LIKE ? ESCAPE '!'",
            ^full_text.title_prefix?,
            entry.normalized_title,
            ^full_text.title_prefix
          ),
        title_match:
          fragment(
            "to_tsvector('public.operately'::regconfig, coalesce(?, '')) @@ (CASE WHEN ? THEN to_tsquery('public.operately'::regconfig, ?) ELSE websearch_to_tsquery('public.operately'::regconfig, ?) END)",
            entry.title,
            ^full_text.use_prefix?,
            ^full_text.tsquery_expr,
            ^full_text.websearch_expr
          ),
        body_snippet:
          fragment(
            "CASE WHEN (? AND ? LIKE ? ESCAPE '!') OR to_tsvector('public.operately'::regconfig, coalesce(?, '')) @@ (CASE WHEN ? THEN to_tsquery('public.operately'::regconfig, ?) ELSE websearch_to_tsquery('public.operately'::regconfig, ?) END) THEN NULL ELSE ts_headline('public.operately'::regconfig, coalesce(?, ''), CASE WHEN ? THEN to_tsquery('public.operately'::regconfig, ?) ELSE websearch_to_tsquery('public.operately'::regconfig, ?) END, ?) END",
            ^full_text.title_prefix?,
            entry.normalized_title,
            ^full_text.title_prefix,
            entry.title,
            ^full_text.use_prefix?,
            ^full_text.tsquery_expr,
            ^full_text.websearch_expr,
            entry.body,
            ^full_text.use_prefix?,
            ^full_text.tsquery_expr,
            ^full_text.websearch_expr,
            ^snippet_options
          )
      },
      order_by: [
        desc: entry.normalized_title == ^full_text.normalized_title,
        desc: fragment("? AND ? LIKE ? ESCAPE '!'", ^full_text.title_prefix?, entry.normalized_title, ^full_text.title_prefix),
        desc:
          fragment(
            "ts_rank_cd(ARRAY[0.0,0.0,0.0,1.0]::real[], ?, CASE WHEN ? THEN to_tsquery('public.operately'::regconfig, ?) ELSE websearch_to_tsquery('public.operately'::regconfig, ?) END)",
            field(entry, :search_vector),
            ^full_text.use_prefix?,
            ^full_text.tsquery_expr,
            ^full_text.websearch_expr
          ),
        desc:
          fragment(
            "ts_rank_cd(ARRAY[0.0,0.0,1.0,0.0]::real[], ?, CASE WHEN ? THEN to_tsquery('public.operately'::regconfig, ?) ELSE websearch_to_tsquery('public.operately'::regconfig, ?) END)",
            field(entry, :search_vector),
            ^full_text.use_prefix?,
            ^full_text.tsquery_expr,
            ^full_text.websearch_expr
          ),
        asc: entry.source_id
      ],
      limit: @limit
    )
    |> recursive_ctes(true)
    |> with_cte(@candidates_cte, as: ^candidates, materialized: true)
    |> with_cte(^candidate_ancestors_cte, as: ^candidate_ancestors)
  end

  defp matched_candidates_query(company_id, eligible_items, accessible_contexts, full_text) do
    from(entry in Entry,
      as: :entry,
      join: item in subquery(eligible_items),
      on: item.source_id == entry.source_id and item.source_type == entry.source_type,
      join: accessible_context in subquery(accessible_contexts),
      on: accessible_context.id == entry.access_context_id,
      where: entry.company_id == ^company_id,
      where: entry.company_id == item.company_id,
      where: entry.resource_hub_id == item.resource_hub_id,
      where: entry.access_context_id == item.access_context_id,
      where: fragment("? IS NOT DISTINCT FROM ?", entry.space_id, item.space_id),
      where: fragment("? IS NOT DISTINCT FROM ?", entry.project_id, item.project_id),
      where: fragment("? IS NOT DISTINCT FROM ?", entry.goal_id, item.goal_id),
      where: ^FullTextQuery.match_dynamic(full_text),
      select: %{
        entry_id: entry.id,
        resource_hub_id: item.resource_hub_id,
        parent_folder_id: item.parent_folder_id,
        owner_name: item.owner_name
      }
    )
  end

  defp candidate_ancestors_query do
    candidates =
      from(candidate in @candidates_cte,
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
