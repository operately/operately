defmodule OperatelyWeb.Api.People.UpdateTaskOrdering do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :task_ids, list_of(:id), null: false
  end

  outputs do
    field :task_ids, list_of(:string), null: false
  end

  def call(conn, inputs) do
    with {:ok, person} <- find_me(conn),
         {:ok, ids} <- Operately.People.TaskOrdering.update(person, inputs.task_ids) do
      {:ok, %{task_ids: Enum.map(ids, &Operately.ShortUuid.encode!/1)}}
    end
  end
end
