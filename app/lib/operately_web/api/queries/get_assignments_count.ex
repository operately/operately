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

  # Note: Previous implementation used individual count functions for each assignment type,
  # but this has been replaced with using Assignments.Loader directly to ensure consistency
  # with GetAssignments and prevent the notification badge count from diverging from the
  # actual displayed items.
end
