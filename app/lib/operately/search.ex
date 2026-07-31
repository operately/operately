defmodule Operately.Search do
  @moduledoc "Provides permission-aware full-text search queries."

  alias Operately.People.Person
  alias Operately.ResourceHubs.ResourceHub
  alias Operately.Search.{CompanyQuery, ResourceHubQuery}

  @doc """
  Returns permission-aware, relevance-ranked full-text results for a person's company.
  """
  def search_company(%Person{} = person, query), do: CompanyQuery.search(person, query)

  @doc """
  Returns fully hydrated resource-hub nodes in full-text relevance order.
  """
  def search_resource_hub(%ResourceHub{} = hub, query), do: ResourceHubQuery.search(hub, query)
end
