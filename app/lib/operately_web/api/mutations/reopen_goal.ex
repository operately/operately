defmodule OperatelyWeb.Api.Mutations.ReopenGoal do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.{Goal, Permissions}
  alias Operately.Operations.GoalReopening

  inputs do
    field? :id, :id, null: true
    field? :message, :string, null: true
    field? :send_notifications_to_everyone, :boolean, null: true
    field? :subscriber_ids, list_of(:id), null: true
  end

  outputs do
    field? :goal, :goal, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:goal, fn ctx -> Goal.get(ctx.me, id: inputs.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.goal.request_info.access_level, :can_reopen) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:operation, fn ctx -> GoalReopening.run(ctx.me, ctx.goal, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{goal: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  def respond(result) do
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
    {:ok,
     %{
       content: Jason.decode!(inputs.message),
       send_to_everyone: inputs[:send_notifications_to_everyone] || false,
       subscriber_ids: inputs[:subscriber_ids] || [],
       subscription_parent_type: :comment_thread
     }}
  end
end
