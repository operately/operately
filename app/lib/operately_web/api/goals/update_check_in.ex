defmodule OperatelyWeb.Api.Goals.UpdateCheckIn do
  @moduledoc """
  Updates a goal check-in.
  """

  use Gettext, backend: OperatelyWeb.Gettext
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.Goals.CheckInInputs
  alias Operately.Goals.Update
  alias Operately.Goals.Update.Permissions
  alias Operately.Operations.GoalCheckInEdit

  inputs do
    field :id, :id, null: false
    field? :due_date, :contextual_date, null: true

    field? :status, :goal_check_in_status, null: false
    field :content, :json, null: false
    field? :state, :check_in_state, null: true
    field? :new_target_values, :string, null: true
    field? :checklist, list_of(:goal_check_update), null: true
    field? :scheduled_at, :datetime, null: true
  end

  outputs do
    field? :update, :goal_progress_update, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> Action.run(:me, fn -> find_me(conn) end)
    |> Action.run(:update, fn ctx -> Update.get(ctx.me, id: inputs.id, opts: [preload: [goal: [:targets, :checks]]]) end)
    |> Action.run(:check_draft_access, fn ctx -> check_draft_access(ctx.update, ctx.me) end)
    |> Action.run(:check_permissions, fn ctx -> Permissions.check(ctx.update.request_info.access_level, ctx.update, ctx.me.id, :can_edit, company_read_only: company_read_only(conn)) end)
    |> Action.run(:attrs, fn ctx -> parse_inputs(inputs, ctx.update) end)
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
      {:error, :operation, %{error: :scheduled_at_must_be_in_the_future}} ->
        {:error, :bad_request, gettext("Scheduled time must be in the future")}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs, update) do
    with {:ok, target_values} <- target_values(inputs, update),
         :ok <- CheckInInputs.validate_checklist(inputs[:checklist], update.goal.checks),
         :ok <- validate_target_values(target_values, update) do
      publishing? = update.state != :published and inputs[:state] == :published
      checklist = if publishing? and is_nil(inputs[:checklist]), do: Enum.map(update.checks, &Map.from_struct/1), else: inputs[:checklist]

      {:ok,
       %{
         status: inputs[:status] || update.status,
         content: inputs.content,
         state: inputs[:state],
         new_target_values: target_values,
         checklist: checklist,
         scheduled_at: inputs[:scheduled_at]
       }
       |> Map.merge(due_date_inputs(inputs, update, publishing?))}
    end
  end

  defp target_values(inputs, update) do
    encoded =
      if update.state != :published and inputs[:state] == :published and is_nil(inputs[:new_target_values]) do
        update.targets
        |> Enum.map(&%{id: Operately.ShortUuid.encode!(&1.id), value: &1.value})
        |> Jason.encode!()
      else
        inputs[:new_target_values]
      end

    CheckInInputs.decode_target_values(encoded, update.goal.targets)
  end

  defp due_date_inputs(inputs, update, publishing?) do
    cond do
      Map.has_key?(inputs, :due_date) -> Map.take(inputs, [:due_date])
      publishing? and not is_nil(update.timeframe) -> %{due_date: update.timeframe.contextual_end_date}
      true -> %{}
    end
  end

  defp validate_target_values(nil, _update), do: :ok

  defp validate_target_values(values, update) do
    ids = Enum.map(values, & &1["id"])
    allowed = MapSet.intersection(MapSet.new(update.targets, & &1.id), MapSet.new(update.goal.targets, & &1.id))
    if Enum.uniq(ids) == ids and Enum.all?(ids, &MapSet.member?(allowed, &1)), do: :ok, else: {:error, :bad_request}
  end
end
