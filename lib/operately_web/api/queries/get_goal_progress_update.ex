defmodule OperatelyWeb.Api.Queries.GetGoalProgressUpdate do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
  end

  outputs do
    field :update, :goal_progress_update
  end

  def call(_conn, inputs) do
    {:ok, id} = decode_id(inputs.id)
    update = Operately.Updates.get_update!(id)
    update = Operately.Repo.preload(update, [:author, :acknowledging_person, reactions: [:person]])

    {:ok, %{update: OperatelyWeb.Api.Serializer.serialize(update, level: :full)}}
  end
end
