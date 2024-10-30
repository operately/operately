defmodule OperatelyWeb.Api.Mutations.EditGoalProgressUpdate do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.{Permissions, Update}
  alias Operately.Operations.GoalCheckInEdit

  inputs do
    field :id, :string
    field :status, :string
    field :content, :string
    field :new_target_values, :string
  end

  outputs do
    field :update, :goal_progress_update
  end

  def call(conn, inputs) do
    Action.new()
    |> Action.run(:id, fn -> decode_id(inputs.id) end)
    |> Action.run(:attrs, fn -> parse_inputs(inputs) end)
    |> Action.run(:me, fn -> find_me(conn) end)
    |> Action.run(:update, fn ctx -> load(ctx) end)
    |> Action.run(:check_permissions, fn ctx -> Permissions.check(ctx.update.request_info.access_level, :can_edit_check_in) end)
    |> Action.run(:operation, fn ctx -> GoalCheckInEdit.run(ctx.me, ctx.update.goal, ctx.update, ctx.attrs) end)
    |> Action.run(:serialized, fn ctx -> {:ok, %{update: OperatelyWeb.Api.Serializer.serialize(ctx.update, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :update, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    {:ok, %{
      status: inputs.status,
      content: Jason.decode!(inputs.content),
      new_target_values: Jason.decode!(inputs.new_target_values),
    }}
  end

  defp load(ctx) do
    Update.get(ctx.me, id: ctx.id, opts: [
      preload: [goal: :targets]
    ])
  end
end
