defmodule OperatelyWeb.Api.ResourceHubs.List do
  @moduledoc "Lists accessible resource hubs in a space, including its default hub."

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups.Group
  alias Operately.ResourceHubs

  inputs do
    field :space_id, :id, null: false
  end

  outputs do
    field :hubs, list_of(:resource_hub_summary), null: false
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, space} <- Group.get(me, id: inputs.space_id) do
      {:ok, %{hubs: Serializer.serialize(ResourceHubs.list_summaries(me, space))}}
    end
  end
end
