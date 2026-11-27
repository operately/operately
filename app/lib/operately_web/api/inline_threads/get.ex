defmodule OperatelyWeb.Api.InlineThreads.Get do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Comments.InlineThread

  inputs do
    field :resource_id, :id, null: false
    field :thread_id, :id, null: false
  end

  outputs do
    field :thread, :inline_thread, null: false
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, thread} <- InlineThread.get(me, id: inputs.thread_id, resource_id: inputs.resource_id, opts: InlineThread.read_options()) do
      {:ok, %{thread: Serializer.serialize(thread, level: :full)}}
    end
  end
end
