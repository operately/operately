defmodule OperatelyWeb.Api.Queries.GetAssignments do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Assignments.Loader


  outputs do
    field? :assignments, list_of(:review_assignment)
  end

  def call(conn, _inputs) do
    company = company(conn)
    me = me(conn)

    [mine: my_assignments, reports: _] = Loader.load(me, company)

    {:ok, %{assignments: Serializer.serialize(my_assignments)}}
  end
end
