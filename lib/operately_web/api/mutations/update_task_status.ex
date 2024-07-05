defmodule OperatelyWeb.Api.Mutations.UpdateTaskStatus do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :task_id, :string
    field :status, :string
    field :column_index, :integer
  end

  outputs do
    field :task, :task
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.task_id)

    author = me(conn)
    status = inputs.status
    column_index = inputs.column_index

    {:ok, task} = Operately.Operations.TaskStatusChange.run(author, id, status, column_index)
    {:ok, %{task: Serializer.serialize(task, level: :essential)}}
  end
end
