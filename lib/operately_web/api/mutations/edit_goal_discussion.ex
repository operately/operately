defmodule OperatelyWeb.Api.Mutations.EditGoalDiscussion do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :activity_id, :string
    field :title, :string
    field :message, :string
  end

  def call(conn, inputs) do
    author = me(conn)
    {:ok, activity_id} = decode_id(inputs.activity_id)
    title = inputs.title
    message = inputs.message

    {:ok, _} = Operately.Operations.GoalDiscussionEditing.run(author, activity_id, title, message)

    {:ok, %{}}
  end
end
