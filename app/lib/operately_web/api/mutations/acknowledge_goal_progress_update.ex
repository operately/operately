defmodule OperatelyWeb.Api.Mutations.AcknowledgeGoalProgressUpdate do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.{Update, Permissions}
  alias Operately.Operations.GoalUpdateAcknowledging

  inputs do
    field :id, :string
  end

  outputs do
    field :update, :goal_progress_update
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:id, fn -> decode_id(inputs.id) end)
    |> run(:me, fn -> find_me(conn) end)
    |> run(:update, fn ctx -> Update.get(ctx.me, id: ctx.id, opts: [preload: :goal]) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.update.request_info.access_level, :can_acknowledge_check_in) end)
    |> run(:operation, fn ctx -> GoalUpdateAcknowledging.run(ctx.me, ctx.update) end)
    |> run(:serialized, fn ctx -> {:ok, %{update: Serializer.serialize(ctx.operation, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :update, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
