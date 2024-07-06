defmodule OperatelyWeb.Api.Queries.GetComments do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :entity_id, :string
    field :entity_type, :string
  end

  outputs do
    field :comments, list_of(:comment)
  end

  def call(_conn, inputs) do
    {:ok, id} = decode_id(inputs.entity_id)
    entity_type = String.to_existing_atom(inputs.entity_type)
    comments = Operately.Updates.list_comments(id, entity_type)
    comments = Operately.Repo.preload(comments, [:author, reactions: :person])  

    {:ok, %{comments: Serializer.serialize(comments, level: :full)}}
  end
end
