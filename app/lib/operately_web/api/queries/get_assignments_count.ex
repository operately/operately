defmodule OperatelyWeb.Api.Queries.GetAssignmentsCount do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Assignments.Loader

  outputs do
    field? :count, :integer, null: true
  end

  def call(conn, _inputs) do
    me = me(conn)
    company = company(conn)

    assignments = Loader.load(me, company)
    {:ok, %{count: length(assignments)}}
  end
end
