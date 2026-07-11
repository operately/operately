defmodule OperatelyWeb.Api.Projects.CreateCheckIn do
  @moduledoc """
  Creates a new project check-in.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.Permissions
  alias Operately.Operations.ProjectCheckIn

  inputs do
    field :project_id, :id, null: false
    field :status, :project_check_in_status, null: false
    field :description, :json, null: false
    field? :post_as_draft, :boolean, null: false, default: false
    field? :send_notifications_to_everyone, :boolean, null: false, default: false, external_default: true
    field? :subscriber_ids, list_of(:id), null: false, default: []
    field? :scheduled_at, :datetime, null: true
  end

  outputs do
    field :check_in, :project_check_in, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:project, fn ctx -> Projects.get_project_with_access_level(ctx.attrs.project_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.project.requester_access_level, :can_edit, company_read_only: company_read_only(conn)) end)
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
    {:ok,
     %{
       project_id: inputs.project_id,
       status: inputs.status,
       content: inputs.description,
       post_as_draft: inputs[:post_as_draft],
       send_to_everyone: inputs[:send_notifications_to_everyone],
       subscription_parent_type: :project_check_in,
       subscriber_ids: inputs[:subscriber_ids],
       scheduled_at: inputs[:scheduled_at]
     }}
  end
end
