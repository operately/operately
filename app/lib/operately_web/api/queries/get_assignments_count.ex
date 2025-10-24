defmodule OperatelyWeb.Api.Queries.GetAssignmentsCount do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Assignments.LoaderV2

  outputs do
    field? :count, :integer, null: true
  end

  def call(conn, _inputs) do
    count = LoaderV2.count(me(conn))

    {:ok, %{count: count}}
  end
end
