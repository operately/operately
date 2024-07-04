defmodule OperatelyWeb.Api.Queries.GetDiscussion do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
  end

  outputs do
    field :discussion, :discussion
  end

  def call(_conn, inputs) do
    update = Operately.Updates.get_update!(inputs.id)
    update = Operately.Repo.preload(update, [:author, [reactions: :person], comments: [:author, [reactions: :person]]])
    update = Operately.Updates.Update.preload_space(update)

    {:ok, %{discussion: OperatelyWeb.Api.Serializer.serialize(update, level: :full)}}
  end
end
