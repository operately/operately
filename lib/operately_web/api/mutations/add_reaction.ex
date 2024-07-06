defmodule OperatelyWeb.Api.Mutations.AddReaction do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :entity_id, :string
    field :entity_type, :string
    field :emoji, :string
  end

  outputs do
    field :reaction, :reaction
  end

  def call(conn, inputs) do
    {:ok, entity_id} = decode_id(inputs.entity_id)

    creator = me(conn)
    entity_type = inputs.entity_type
    emoji = inputs.emoji

    {:ok, reaction} = Operately.Operations.ReactionAdding.run(creator, entity_id, entity_type, emoji)
    {:ok, %{reaction: Serializer.serialize(reaction, level: :essential)}}
  end
end
