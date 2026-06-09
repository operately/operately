defmodule OperatelyWeb.Api.Goals.UpdateCheckIn do
  @moduledoc """
  Updates a goal check-in.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.Update
  alias Operately.Goals.Update.Permissions
  alias Operately.Operations.GoalCheckInEdit

  inputs do
    field :id, :id, null: false
    field :due_date, :contextual_date, null: true

    field :status, :goal_check_in_status, null: false
    field :content, :json, null: false
    field? :state, :check_in_state, null: true
    field? :new_target_values, :string, null: true
    field? :checklist, list_of(:goal_check_update), null: true
  end

  outputs do
    field? :update, :goal_progress_update, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> Action.run(:me, fn -> find_me(conn) end)
    |> Action.run(:attrs, fn -> parse_inputs(inputs) end)
    |> Action.run(:update, fn ctx -> Update.get(ctx.me, id: inputs.id, opts: [preload: [goal: [:targets, :checks]]]) end)
    |> Action.run(:check_draft_access, fn ctx -> check_draft_access(ctx.update, ctx.me) end)
    |> Action.run(:check_permissions, fn ctx -> Permissions.check(ctx.update.request_info.access_level, ctx.update, ctx.me.id, :can_edit, company_read_only: company_read_only(conn)) end)
    |> Action.run(:operation, fn ctx -> GoalCheckInEdit.run(ctx.me, ctx.update.goal, ctx.update, ctx.attrs) end)
    |> Action.run(:serialized, fn ctx -> {:ok, %{update: OperatelyWeb.Api.Serializer.serialize(ctx.operation, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :update, _} -> {:error, :not_found}
      {:error, :check_draft_access, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    {:ok,
     %{
       status: inputs.status,
       content: inputs.content,
       state: inputs[:state],
       new_target_values:
         Jason.decode!(inputs.new_target_values)
         |> Enum.map(fn t ->
           {:ok, id} = decode_id(t["id"])
           %{"id" => id, "value" => t["value"]}
         end),
       due_date: inputs.due_date,
       checklist: inputs.checklist || []
     }}
  end
end
