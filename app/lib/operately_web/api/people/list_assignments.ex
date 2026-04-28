defmodule OperatelyWeb.Api.People.ListAssignments do
  @moduledoc """
  Lists assignments for the current user.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Assignments.Loader
  alias Operately.Assignments.Categorizer

  outputs do
    field :due_soon, list_of(:review_assignment_group), null: false
    field :needs_review, list_of(:review_assignment_group), null: false
    field :upcoming, list_of(:review_assignment_group), null: false
  end

  def call(conn, _inputs) do
    company = company(conn)
    me = me(conn)

    assignments = Loader.load(me, company)
    categorized = Categorizer.categorize(assignments)

    {:ok, Serializer.serialize(categorized)}
  end
end
