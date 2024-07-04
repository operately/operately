defmodule OperatelyWeb.Api.Mutations.PostDiscussion do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :space_id, :string
    field :title, :string
    field :body, :string
  end

  outputs do
    field :discussion, :discussion
  end

  def call(conn, inputs) do
    person = me(conn)
    title = inputs.title
    body = inputs.body

    {:ok, space_id} = decode_id(inputs.space_id)
    space = Operately.Groups.get_group!(space_id)

    {:ok, discussion} = Operately.Operations.DiscussionPosting.run(person, space, title, body)
    {:ok, %{discussion: Serializer.serialize(discussion, level: :essential)}}
  end
end
