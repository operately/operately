defmodule OperatelyWeb.Api.Mutations.PostMilestoneComment do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :milestone_id, :string
    field :content, :string
    field :action, :string
  end

  outputs do
    field :comment, :milestone_comment
  end

  def call(conn, inputs) do
    {:ok, milestone_id} = decode_id(inputs.milestone_id)

    action = inputs.action
    person = me(conn)
    milestone = Operately.Projects.get_milestone!(milestone_id)
    message = inputs.content && Jason.decode!(inputs.content)

    {:ok, comment} = Operately.Comments.create_milestone_comment(
      person,
      milestone, 
      action,
      %{
        content: %{"message" => message},
        author_id: person.id,
      }
    )

    {:ok, %{comment: Serializer.serialize(comment)}}
  end
end
