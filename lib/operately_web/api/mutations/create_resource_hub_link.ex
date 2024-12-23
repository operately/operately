defmodule OperatelyWeb.Api.Mutations.CreateResourceHubLink do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Operations.ResourceHubLinkCreating
  alias Operately.ResourceHubs.{Permissions, ResourceHub}

  inputs do
    field :resource_hub_id, :id
    field :folder_id, :id
    field :name, :string
    field :url, :string
    field :description, :string
    field :type, :string
    field :send_notifications_to_everyone, :boolean
    field :subscriber_ids, list_of(:id)
  end

  outputs do
    field :link, :resource_hub_link
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:resource_hub, fn ctx -> ResourceHub.get(ctx.me, id: ctx.attrs.resource_hub_id) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.resource_hub.request_info.access_level, :can_create_link) end)
    |> run(:operation, fn ctx -> ResourceHubLinkCreating.run(ctx.me, ctx.resource_hub, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{link: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :resource_hub, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    description = Jason.decode!(inputs.description)

    {:ok, Map.merge(inputs, %{
      content: description,
      send_to_everyone: inputs[:send_notifications_to_everyone] || false,
      subscription_parent_type: :resource_hub_link,
      subscriber_ids: inputs[:subscriber_ids] || []
    })}
  end
end
