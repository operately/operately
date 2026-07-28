defmodule Operately.Search do
  @moduledoc """
  Provides search queries and manages search-index maintenance runs.

  Each registered source type gets its own `Operately.Search.Maintenance.Run`, with an
  independent cursor, counters, status, and chain of Oban batch jobs. A run starts with
  one job; each completed batch enqueues the next job for that same source type. This
  allows different source types to progress independently and run concurrently.

  Passing `:all` starts one run per registered source type. Those runs are created in
  separate transactions, so runs started before a later failure remain active.
  """

  alias Operately.People.Person
  alias Operately.ResourceHubs.ResourceHub
  alias Operately.Search.Maintenance
  alias Operately.Search.Query.Company
  alias Operately.Search.Query.ResourceHub, as: ResourceHubQuery

  @doc """
  Returns permission-aware, relevance-ranked full-text results for a person's company.
  """
  def search_company(%Person{} = person, query), do: Company.search(person, query)

  @doc """
  Returns fully hydrated resource-hub nodes in full-text relevance order.
  """
  def search_resource_hub(%ResourceHub{} = hub, query), do: ResourceHubQuery.search(hub, query)

  @doc """
  Starts a backfill for one source type string, or one independent backfill per
  registered source type when given `:all`.
  """
  defdelegate start_backfill(source_type), to: Maintenance

  @doc """
  Starts reconciliation for one source type string, or one independent reconciliation
  run per registered source type when given `:all`.
  """
  defdelegate start_reconciliation(source_type), to: Maintenance

  @doc "Returns the maintenance run with the given ID, or `nil` when it does not exist."
  defdelegate get_index_run(id), to: Maintenance, as: :get_run
end
