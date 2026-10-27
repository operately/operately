defmodule OperatelyWeb.Api.People.GetTaskOrdering do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  outputs do
    field :task_ids, list_of(:string), null: false
  end

  def call(conn, _inputs) do
    with {:ok, person} <- find_me(conn) do
      ids = Operately.People.TaskOrdering.get(person)
      {:ok, %{task_ids: Enum.map(ids, &Operately.ShortUuid.encode!/1)}}
    end
  end
end
