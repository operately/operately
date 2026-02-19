defmodule OperatelyWeb.Api.Mutations.ResumeProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :project_id, :id, null: false
    field :message, :json, null: false
    field? :send_notifications_to_everyone, :boolean, null: true
    field? :subscriber_ids, list_of(:id), null: true
  end

  outputs do
    field :project, :project, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:me, fn -> find_me(conn) end)
    |> run(:project, fn ctx -> Operately.Projects.Project.get(ctx.me, id: inputs.project_id) end)
    |> run(:check_permissions, fn ctx -> Operately.Projects.Permissions.check(ctx.project.request_info.access_level, :can_edit) end)
    |> run(:operation, fn ctx -> Operately.Operations.ProjectResuming.run(ctx.me, ctx.project, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{project: OperatelyWeb.Api.Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :project_id, _} -> {:error, :bad_request}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :project, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    {:ok, %{
      content: inputs.message,
      send_to_everyone: inputs[:send_notifications_to_everyone] || false,
      subscriber_ids: inputs[:subscriber_ids] || [],
      subscription_parent_type: :comment_thread
    }}
  end
end
