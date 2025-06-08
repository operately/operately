defmodule OperatelyWeb.Api.Queries.ListGoalContributors do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals

  inputs do
    field? :goal_id, :id
  end

  outputs do
    field? :contributors, list_of(:person)
  end

  def call(conn, inputs) do
    contribs = Goals.list_goal_contributors(inputs.goal_id, requester: me(conn))
    {:ok, %{contributors: Serializer.serialize(contribs, level: :full)}}
  end
end
