defmodule OperatelyWeb.Api.Queries.GetAssignments do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Assignments.LoaderV2

  outputs do
    field :assignments, list_of(:review_assignment), null: false
  end

  def call(conn, _inputs) do
    company = company(conn)
    me = me(conn)

    assignments = LoaderV2.load(me, company)

    {:ok, %{assignments: Serializer.serialize(assignments)}}
  end
end
