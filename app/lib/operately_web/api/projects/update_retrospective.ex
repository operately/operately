defmodule OperatelyWeb.Api.Projects.UpdateRetrospective do
  @moduledoc """
  Updates a project retrospective.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.{Retrospective, Permissions}
  alias Operately.Operations.ProjectRetrospectiveEditing

  inputs do
    field :retrospective_id, :id, null: false
    field :content, :json, null: false
    field :success_status, :success_status, null: false
  end

  outputs do
    field :retrospective, :project_retrospective
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:retrospective, fn ctx -> load(inputs.retrospective_id, ctx.me) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.retrospective.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> ProjectRetrospectiveEditing.run(ctx.me, ctx.retrospective, inputs)  end)
    |> run(:serialized, fn ctx -> {:ok, %{retrospective: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :retrospective, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load(id, me) do
    Retrospective.get(me, id: id, opts: [
      preload: :project,
    ])
  end
end
