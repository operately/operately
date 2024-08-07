defmodule OperatelyWeb.Api.Mutations.EditDiscussion do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :discussion_id, :string
    field :title, :string
    field :body, :string
  end

  outputs do
    field :discussion, :discussion
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.discussion_id)
    person = me(conn)
    title = inputs.title
    body = inputs.body
    discussion = Operately.Updates.get_update!(id)

    {:ok, discussion} = Operately.Operations.DiscussionEditing.run(person, discussion, title, body)
    {:ok, %{discussion: Serializer.serialize(discussion, level: :essential)}}
  end
end
