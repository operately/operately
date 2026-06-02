defmodule OperatelyWeb.Api.Projects.UpdateCheckIn do
  @moduledoc """
  Updates an existing project check-in's status and/or description.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.Permissions
  alias Operately.Operations.ProjectCheckInEdit

  inputs do
    field :check_in_id, :id, null: false
    field :status, :project_check_in_status, null: false
    field :description, :json, null: false
  end

  outputs do
    field :check_in, :project_check_in, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:check_in, fn ctx -> Projects.get_check_in_with_access_level(inputs.check_in_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.check_in.requester_access_level, :can_edit, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> ProjectCheckInEdit.run(ctx.me, ctx.check_in, inputs.status, inputs.description) end)
    |> run(:serialized, fn ctx -> {:ok, %{check_in: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :check_in, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
