defmodule OperatelyWeb.Api.Goals.CreateCheckIn do
  @moduledoc """
  Creates a new check-in for a goal.
  """

  use Gettext, backend: OperatelyWeb.Gettext
  use TurboConnect.Mutation
  require Logger
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.Goals.CheckInInputs
  alias Operately.Goals.Goal
  alias Operately.Goals.Permissions
  alias Operately.Operations.GoalCheckIn

  inputs do
    field :goal_id, :id, null: false
    field :status, :goal_check_in_status, null: false
    field? :due_date, :contextual_date, null: true
    field? :checklist, list_of(:goal_check_update), null: false

    field :content, :json, null: false
    field? :new_target_values, :string, null: false
    field? :post_as_draft, :boolean, null: false, default: false
    field? :send_notifications_to_everyone, :boolean, null: false, default: false, external_default: true
    field? :subscriber_ids, list_of(:id), null: false, default: []
    field? :scheduled_at, :datetime, null: true
  end

  outputs do
    field? :update, :goal_progress_update, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:goal, fn ctx -> Goal.get(ctx.me, id: inputs.goal_id, opts: [preload: [:targets, :checks]]) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.goal.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)) end)
    |> run(:attrs, fn ctx -> parse_inputs(inputs, ctx.goal) end)
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

      {:error, :operation, %{error: :scheduled_at_must_be_in_the_future}} ->
        {:error, :bad_request, gettext("Scheduled time must be in the future")}

      {:error, :operation, _} ->
        {:error, :internal_server_error}

      _ ->
        {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs, goal) do
    with {:ok, target_values} <- CheckInInputs.decode_target_values(inputs[:new_target_values], goal.targets),
         :ok <- CheckInInputs.validate_checklist(inputs[:checklist], goal.checks) do
      {:ok,
       %{
         target_values: target_values,
         content: inputs.content,
         status: inputs.status,
         checklist: inputs[:checklist],
         post_as_draft: inputs[:post_as_draft],
         send_to_everyone: inputs[:send_notifications_to_everyone],
         subscription_parent_type: :goal_update,
         subscriber_ids: inputs[:subscriber_ids],
         scheduled_at: inputs[:scheduled_at]
       }
       |> maybe_put_due_date(inputs)}
    end
  end

  defp maybe_put_due_date(attrs, inputs) do
    if Map.has_key?(inputs, :due_date) do
      Map.put(attrs, :due_date, inputs[:due_date])
    else
      attrs
    end
  end
end
