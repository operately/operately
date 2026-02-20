defmodule OperatelyWeb.Api.Mutations.PostProjectCheckIn do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.Permissions
  alias Operately.Operations.ProjectCheckIn

  inputs do
    field? :project_id, :string, null: true
    field? :status, :string, null: true
    field? :description, :string, null: true
    field? :send_notifications_to_everyone, :boolean, null: true
    field? :subscriber_ids, list_of(:string), null: true
  end

  outputs do
    field? :check_in, :project_check_in, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:project, fn ctx -> Projects.get_project_with_access_level(ctx.attrs.project_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.project.requester_access_level, :can_edit) end)
    |> run(:operation, fn ctx -> ProjectCheckIn.run(ctx.me, ctx.project, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{check_in: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :project, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    {:ok, project_id} = decode_id(inputs.project_id)
    {:ok, subscriber_ids} = decode_id(inputs[:subscriber_ids], :allow_nil)

    {:ok, %{
      project_id: project_id,
      status: String.to_atom(inputs.status),
      content: Jason.decode!(inputs.description),
      send_to_everyone: inputs[:send_notifications_to_everyone] || false,
      subscription_parent_type: :project_check_in,
      subscriber_ids: subscriber_ids || []
    }}
  end
end
