defmodule OperatelyWeb.Api.Queries.GetDiscussions do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :space_id, :string
  end

  outputs do
    field :discussions, list_of(:discussion)
  end

  def call(_conn, inputs) do
    {:ok, space_id} = decode_id(inputs.space_id)

    updates = Operately.Updates.list_updates(space_id, :space, :project_discussion)
    updates = Operately.Repo.preload(updates, [:author])

    {:ok, %{discussions: Serializer.serialize(updates, level: :essential)}}
  end
end
