defmodule OperatelyWeb.Api.Mutations.AddKeyResource do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.{Project, Permissions}
  alias Operately.Operations.ProjectKeyResourceAdding

  inputs do
    field :project_id, :string
    field :title, :string
    field :link, :string
    field :resource_type, :string
  end

  outputs do
    field :key_resource, :project_key_resource
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_attrs(inputs) end)
    |> run(:project, fn ctx -> load_project(ctx) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.project.request_info.access_level, :can_edit_resources) end)
    |> run(:operation, fn ctx -> ProjectKeyResourceAdding.run(ctx.me, ctx.project, ctx.attrs) end)
    |> run(:serialized, fn ctx -> serialize(ctx) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :project, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_attrs(inputs) do
    {:ok, id} = decode_id(inputs.project_id)
    attrs = %{inputs | project_id: id}

    {:ok, attrs}
  end

  defp load_project(ctx) do
    Project.get(ctx.me, id: ctx.attrs.project_id)
  end

  defp serialize(ctx) do
    resource = Map.put(ctx.operation, :project, ctx.project)
    {:ok, %{key_resource: OperatelyWeb.Api.Serializer.serialize(resource)}}
  end
end
