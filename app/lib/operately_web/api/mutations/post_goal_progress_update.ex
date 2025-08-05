defmodule OperatelyWeb.Api.Mutations.PostGoalProgressUpdate do
  use TurboConnect.Mutation
  require Logger
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.Goal
  alias Operately.Goals.Permissions
  alias Operately.Operations.GoalCheckIn

  inputs do
    field :goal_id, :id, null: false
    field :status, :string, null: false
    field :due_date, :contextual_date, null: true
    field :checklist, list_of(:goal_check)

    field? :content, :json, null: true
    field? :new_target_values, :string, null: true
    field? :send_notifications_to_everyone, :boolean, null: true
    field? :subscriber_ids, list_of(:string), null: true
  end

  outputs do
    field? :update, :goal_progress_update, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:goal, fn ctx -> Goal.get(ctx.me, id: inputs.goal_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.goal.request_info.access_level, :can_check_in) end)
    |> run(:operation, fn ctx -> GoalCheckIn.run(ctx.me, ctx.goal, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{update: Serializer.serialize(ctx.operation, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} ->
        {:ok, ctx.serialized}

      {:error, :attrs, _} ->
        {:error, :bad_request}

      {:error, :goal, _} ->
        {:error, :not_found}

      {:error, :check_permissions, _} ->
        {:error, :forbidden}

      {:error, :operation, _} ->
        {:error, :internal_server_error}

      _ ->
        {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    {:ok, subscriber_ids} = decode_id(inputs[:subscriber_ids], :allow_nil)

    {:ok,
     %{
       target_values:
         Jason.decode!(inputs.new_target_values)
         |> Enum.map(fn t ->
           {:ok, id} = decode_id(t["id"])
           %{"id" => id, "value" => t["value"]}
         end),
       content: inputs.content,
       status: String.to_atom(inputs.status),
       due_date: inputs.due_date,
       send_to_everyone: inputs[:send_notifications_to_everyone] || false,
       subscription_parent_type: :goal_update,
       subscriber_ids: subscriber_ids || []
     }}
  end
end
