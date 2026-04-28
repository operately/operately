defmodule OperatelyWeb.Api.People.GetAssignmentsCount do
  @moduledoc """
  Gets the count of assignments for the current user.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Assignments.Loader

  outputs do
    field :count, :integer, null: false
  end

  def call(conn, _inputs) do
    count = Loader.count(me(conn))

    {:ok, %{count: count}}
  end
end
