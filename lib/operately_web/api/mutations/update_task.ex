defmodule OperatelyWeb.Api.Mutations.UpdateTask do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :task_id, :string
    field :name, :string
    field :assigned_ids, list_of(:string)
  end

  outputs do
    field :task, :task
  end

  def call(conn, inputs) do
    {:ok, task_id} = decode_id(inputs.task_id)

    author = me(conn)
    name = inputs.name
    assigned_ids = inputs.assigned_ids

    {:ok, task} = Operately.Operations.TaskUpdate.run(author, task_id, name, assigned_ids)
    {:ok, %{task: Serializer.serialize(task, level: :essential)}}
  end
end
