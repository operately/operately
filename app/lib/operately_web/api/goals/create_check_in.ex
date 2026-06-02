defmodule OperatelyWeb.Api.Goals.CreateCheckIn do
  @moduledoc """
  Creates a new check-in for a goal.
  """

  use TurboConnect.Mutation
  require Logger
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.Goal
  alias Operately.Goals.Permissions
  alias Operately.Operations.GoalCheckIn

  inputs do
    field :goal_id, :id, null: false
    field :status, :goal_check_in_status, null: false
    field :due_date, :contextual_date, null: true
    field? :checklist, list_of(:goal_check_update), null: false

    field :content, :json, null: false
    field? :new_target_values, :string, null: false
    field? :send_notifications_to_everyone, :boolean, null: false, default: false, external_default: true
    field? :subscriber_ids, list_of(:id), null: false, default: []
  end

  outputs do
    field? :update, :goal_progress_update, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:goal, fn ctx -> Goal.get(ctx.me, id: inputs.goal_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.goal.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)) end)
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
    target_values = if inputs[:new_target_values] do
         Jason.decode!(inputs.new_target_values)
         |> Enum.map(fn t ->
           {:ok, id} = decode_id(t["id"])
           %{"id" => id, "value" => t["value"]}
      end)
    else
      nil
    end

    {:ok,
     %{
       target_values: target_values,
       content: inputs.content,
       status: inputs.status,
       due_date: inputs.due_date,
       checklist: inputs[:checklist],
       send_to_everyone: inputs[:send_notifications_to_everyone],
       subscription_parent_type: :goal_update,
       subscriber_ids: inputs[:subscriber_ids]
     }}
  end
end
