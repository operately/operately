defmodule OperatelyWeb.Api.Mutations.CloseGoal do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.{Goal, Permissions}
  alias Operately.Operations.GoalClosing

  inputs do
    field :goal_id, :id
    field :success, :string
    field :retrospective, :string
    field? :send_notifications_to_everyone, :boolean
    field? :subscriber_ids, list_of(:id)
    field :success_status, :string
  end

  outputs do
    field :goal, :goal
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:goal, fn ctx -> Goal.get(ctx.me, id: inputs.goal_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.goal.request_info.access_level, :can_edit) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:operation, fn ctx -> GoalClosing.run(ctx.me, ctx.goal, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{goal: Serializer.serialize(ctx.operation)}} end)
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
      success: inputs.success,
      success_status: String.to_atom(inputs.success_status),
      content: Jason.decode!(inputs.retrospective),
      send_to_everyone: inputs[:send_notifications_to_everyone] || false,
      subscriber_ids: inputs[:subscriber_ids] || [],
      subscription_parent_type: :comment_thread
    }}
  end
end
