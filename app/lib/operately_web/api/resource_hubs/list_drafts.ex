defmodule OperatelyWeb.Api.ResourceHubs.ListDrafts do
  @moduledoc "Lists the requester's drafts across all live folders in a resource hub."

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{Drafts, ResourceHub}

  inputs do
    field :resource_hub_id, :id, null: false
  end

  outputs do
    field :draft_nodes, list_of(:resource_hub_node), null: false
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, hub} <- ResourceHub.get(me, id: inputs.resource_hub_id) do
      drafts = Drafts.list(hub, me)
      {:ok, %{draft_nodes: Serializer.serialize(drafts, level: :essential, company: company(conn))}}
    end
  end
end
