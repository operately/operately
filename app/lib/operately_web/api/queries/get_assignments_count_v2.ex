defmodule OperatelyWeb.Api.Queries.GetAssignmentsCountV2 do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Assignments.LoaderV2

  outputs do
    field? :count, :integer, null: true
  end

  def call(conn, _inputs) do
    company = company(conn)
    me = me(conn)

    count = LoaderV2.count(me, company)
    {:ok, %{count: count}}
  end
end
