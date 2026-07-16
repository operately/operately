defmodule OperatelyWeb.Api.Wrappers.Goals.AcknowledgeRetrospective do
  @moduledoc """
  Acknowledges a goal retrospective by goal ID.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.Retrospective
  alias OperatelyWeb.Api.Goals.AcknowledgeRetrospective, as: GoalAcknowledgeRetrospective

  inputs do
    field :goal_id, :id, null: false
  end

  outputs do
    field :activity, :activity, null: false
  end

  def call(conn, inputs) do
    with {:ok, activity_id} <- Retrospective.get(goal_id: inputs.goal_id) do
      GoalAcknowledgeRetrospective.call(conn, %{id: activity_id})
    end
  end
end
