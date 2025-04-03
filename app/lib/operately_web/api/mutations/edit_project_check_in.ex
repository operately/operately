defmodule OperatelyWeb.Api.Mutations.EditProjectCheckIn do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.Permissions
  alias Operately.Operations.ProjectCheckInEdit

  inputs do
    field :check_in_id, :string
    field :status, :string
    field :description, :string
  end

  outputs do
    field :check_in, :project_check_in
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.check_in_id) end)
    |> run(:description, fn -> {:ok, Jason.decode!(inputs.description)} end)
    |> run(:check_in, fn ctx -> Projects.get_check_in_with_access_level(ctx.id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.check_in.requester_access_level, :can_edit_check_in) end)
    |> run(:operation, fn ctx -> ProjectCheckInEdit.run(ctx.me, ctx.check_in, inputs.status, ctx.description) end)
    |> run(:serialized, fn ctx -> {:ok, %{check_in: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :description, _} -> {:error, :bad_request}
      {:error, :check_in, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
