defmodule OperatelyWeb.Api.Mutations.CreateComment do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :entity_id, :string
    field :entity_type, :string
    field :content, :string
  end

  outputs do
    field :comment, :comment
  end

  def call(conn, inputs) do
    author = me(conn)
    {:ok, entity_id} = decode_id(inputs.entity_id)
    entity_type = inputs.entity_type
    {:ok, content} = Jason.decode(inputs.content)

    {:ok, comment} = Operately.Operations.CommentAdding.run(author, entity_id, entity_type, content)
    {:ok, %{comment: Serializer.serialize(comment, level: :essential)}}
  end
end
