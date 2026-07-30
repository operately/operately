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
  end

  outputs do
    field :results, list_of(:search_result), null: false
  end

  def call(conn, inputs) do
    results =
      conn
      |> me()
      |> Search.search_company(inputs.query)
      |> Serializer.serialize(level: :essential)

    {:ok, %{results: results}}
  end
end
