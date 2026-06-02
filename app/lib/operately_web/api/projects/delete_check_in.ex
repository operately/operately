defmodule OperatelyWeb.Api.Projects.DeleteCheckIn do
  @moduledoc """
  Deletes a project check-in.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.{CheckIn, Permissions}
  alias Operately.Operations.ProjectCheckInDeleting

  inputs do
    field :check_in_id, :id, null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:check_in, fn ctx -> CheckIn.get(ctx.me, id: inputs.check_in_id, opts: [preload: [:project]]) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.check_in.request_info.access_level, :has_full_access, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> ProjectCheckInDeleting.run(ctx.check_in) end)
    |> run(:serialized, fn _ -> {:ok, %{success: true}} end)
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
