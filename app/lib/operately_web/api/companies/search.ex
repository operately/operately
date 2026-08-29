defmodule OperatelyWeb.Api.Companies.Search do
  @moduledoc """
  Returns relevance-ranked full-text results visible to the current person.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Search
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :query, :string, null: false
    field? :space_ids, list_of(:id), null: true
    field? :types, list_of(:search_result_type), null: true
    field? :time_range, :search_time_range, null: true
    field? :sort, :search_sort, null: true
  end

  outputs do
    field :results, list_of(:search_result), null: false
  end

  def call(conn, inputs) do
    results =
      conn
      |> me()
      |> Search.search_company(inputs.query, filters(inputs))
      |> Serializer.serialize(level: :essential, company: company(conn))

    {:ok, %{results: results}}
  end

  defp filters(inputs) do
    %{
      space_ids: inputs[:space_ids],
      types: inputs[:types],
      time_range: inputs[:time_range],
      sort: inputs[:sort]
    }
  end
end
