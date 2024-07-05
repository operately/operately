defmodule OperatelyWeb.Api.Mutations.ChangeTaskDescription do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :task_id, :string
    field :description, :string
  end

  outputs do
    field :task, :task
  end

  def call(conn, inputs) do
    author = me(conn)
    task_id = inputs.task_id
    description = inputs.description && Jason.decode!(inputs.description)

    {:ok, task} = Operately.Operations.TaskDescriptionChange.run(author, task_id, description)
    {:ok, %{task: Serializer.serialize(task, level: :essential)}}
  end
end
