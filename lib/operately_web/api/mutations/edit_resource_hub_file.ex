defmodule OperatelyWeb.Api.Mutations.EditResourceHubFile do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{File, Permissions}
  alias Operately.Operations.ResourceHubFileEditing

  inputs do
    field :file_id, :id
    field :name, :string
    field :description, :string
  end

  outputs do
    field :file, :resource_hub_file
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_attrs(inputs) end)
    |> run(:file, fn ctx -> find_file(ctx) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.file.request_info.access_level, :can_edit_file) end)
    |> run(:operation, fn ctx -> ResourceHubFileEditing.run(ctx.me, ctx.file, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{file: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :file, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_attrs(inputs) do
    description = Jason.decode!(inputs.description)
    {:ok, Map.put(inputs, :description, description)}
  end

  defp find_file(ctx) do
    File.get(ctx.me, id: ctx.attrs.file_id, opts: [preload: [:node, :resource_hub]])
  end
end
