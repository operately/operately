defmodule OperatelyWeb.Api.Files.Create do
  @moduledoc """
  Creates new files in a resource hub.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Operations.ResourceHubFileCreating
  alias Operately.ResourceHubs.{Permissions, ResourceHub}

  inputs do
    field :resource_hub_id, :id, null: false
    field? :folder_id, :id, null: true
    field :files, list_of(:resource_hub_uploaded_file), null: false
    field? :send_notifications_to_everyone, :boolean, null: false, default: false, external_default: true
    field? :subscriber_ids, list_of(:id), null: false, default: []
  end

  outputs do
    field :files, list_of(:resource_hub_file), null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:resource_hub, fn ctx -> ResourceHub.get(ctx.me, id: ctx.attrs.resource_hub_id) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.resource_hub.request_info.access_level, :can_create_file, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> ResourceHubFileCreating.run(ctx.me, ctx.resource_hub, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{files: Serializer.serialize(ctx.operation)}} end)
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
    files = Enum.map(inputs.files, fn f ->
      description = Jason.decode!(f.description)
      %{f | description: description}
    end)

    {:ok, Map.merge(inputs, %{
      files: files,
      send_to_everyone: inputs[:send_notifications_to_everyone],
      subscriber_ids: inputs[:subscriber_ids]
    })}
  end
end
