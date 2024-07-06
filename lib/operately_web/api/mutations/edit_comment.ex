defmodule OperatelyWeb.Api.Mutations.EditComment do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :content, :string
    field :comment_id, :string
  end

  outputs do
    field :comment, :comment
  end

  def call(_conn, inputs) do
    {:ok, comment_id} = decode_id(inputs.comment_id)
    {:ok, content} = Jason.decode(inputs.content)

    {:ok, comment} = Operately.Operations.CommentEditing.run(comment_id, content)
    {:ok, %{comment: Serializer.serialize(comment, level: :essential)}}
  end
end
