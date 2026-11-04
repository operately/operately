defmodule OperatelyWeb.Api.People.ListMyTasks do
  @moduledoc """
  Lists the current person's open assigned tasks.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.WorkMaps.GetWorkMapQuery

  outputs do
    field :tasks, list_of(:task), null: false
  end

  def call(conn, _inputs) do
    tasks = GetWorkMapQuery.list_assigned_tasks(me(conn), company(conn).id)

    {:ok, %{tasks: Serializer.serialize(tasks, level: :full)}}
  end
end
