defmodule OperatelyWeb.Api.Queries.GetGoalProgressUpdates do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :goal_id, :string
  end

  outputs do
    field :updates, :goal_progress_update
  end

  def call(_conn, inputs) do
    {:ok, id} = decode_id(inputs.goal_id)
    updates = Operately.Updates.list_updates(id, "goal", "status_update")
    {:ok, %{updates: OperatelyWeb.Api.Serializer.serialize(updates)}}
  end
end
