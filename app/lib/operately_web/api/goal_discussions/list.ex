defmodule OperatelyWeb.Api.GoalDiscussions.List do
  @moduledoc """
  Lists discussions for a goal.
  """

  use TurboConnect.Query

  alias OperatelyWeb.Api.Goals.SharedMultiSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :goal_id, :id, null: false
  end

  outputs do
    field :discussions, list_of(:discussion), null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.find_goal(inputs.goal_id)
    |> Steps.check_permissions(:can_view)
    |> Steps.get_discussions()
    |> Steps.commit()
    |> Steps.respond(fn changes ->
      %{discussions: Serializer.serialize(changes.discussions, level: :essential)}
    end)
  end
end
