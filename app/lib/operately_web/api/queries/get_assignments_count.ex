defmodule OperatelyWeb.Api.Queries.GetAssignmentsCount do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Assignments.Loader

  outputs do
    field? :count, :integer, null: true
  end

  def call(conn, _inputs) do
    count = load_assignments_count(me(conn), company(conn))

    {:ok, %{count: count}}
  end

  #
  # Loading data
  #

  defp load_assignments_count(person, company) do
    # Use the same logic as GetAssignments to ensure consistency
    [mine: my_assignments, reports: _] = Loader.load(person, company)
    length(my_assignments)
  end


end
