defmodule OperatelyWeb.Api.Mutations.CreateTask do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :name, :string
    field :assignee_ids, list_of(:string)
    field :description, :string
    field :milestone_id, :string
  end

  outputs do
    field :task, :task
  end

  def call(conn, inputs) do
    {:ok, milestone_id} = decode_id(inputs.milestone_id)
    inputs = %{inputs | milestone_id: milestone_id}

    creator = me(conn)
    {:ok, task} = Operately.Operations.TaskAdding.run(creator, inputs)
    {:ok, %{task: Serializer.serialize(task, level: :essential)}}
  end
end
