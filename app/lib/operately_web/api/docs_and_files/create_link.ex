defmodule OperatelyWeb.Api.DocsAndFiles.CreateLink do
  @moduledoc """
  Creates a new link in a Docs & Files hub.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.DocsAndFiles.HubScope
  alias OperatelyWeb.Api.Links.Create, as: LinkCreate

  inputs do
    field? :space_id, :id, null: true
    field? :project_id, :id, null: true
    field? :folder_id, :id, null: true
    field :name, :string, null: false
    field :url, :string, null: false
    field? :description, :json, null: false
    field :type, :resource_hub_link_type, null: false
    field? :send_notifications_to_everyone, :boolean, null: false, default: false, external_default: true
    field? :subscriber_ids, list_of(:id), null: false, default: []
  end

  outputs do
    field :link, :resource_hub_link, null: false
  end

  def call(conn, inputs) do
    with {:ok, internal_inputs} <- to_internal_inputs(conn, inputs) do
      LinkCreate.call(conn, internal_inputs)
    end
  end

  defp to_internal_inputs(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, internal_inputs} <- HubScope.to_resource_hub_inputs(me, inputs) do
      {:ok, internal_inputs}
    end
  end
end
