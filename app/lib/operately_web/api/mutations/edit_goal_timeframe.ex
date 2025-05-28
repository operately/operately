defmodule OperatelyWeb.Api.Mutations.EditGoalTimeframe do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.{Goal, Permissions}
  alias Operately.Operations.GoalTimeframeEditing

  inputs do
    field :id, :id
    field :timeframe, :timeframe
    field :comment, :string
    field :send_notifications_to_everyone, :boolean
    field :subscriber_ids, list_of(:id)
  end

  outputs do
    field :goal, :goal
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:goal, fn ctx -> Goal.get(ctx.me, id: inputs.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.goal.request_info.access_level, :can_edit) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:operation, fn ctx -> GoalTimeframeEditing.run(ctx.me, ctx.goal, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{goal: OperatelyWeb.Api.Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :goal, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    {:ok, %{
      timeframe: inputs.timeframe,
      content: Jason.decode!(inputs.comment),
      subscription_parent_type: :comment_thread,
      send_to_everyone: inputs[:send_notifications_to_everyone] || false,
      subscriber_ids: inputs[:subscriber_ids] || []
    }}
  end
end
