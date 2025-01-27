defmodule OperatelyWeb.Api.Mutations.CreateGoal do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups.{Group, Permissions}
  alias Operately.Operations.GoalCreation

  inputs do
    field :space_id, :id
    field :name, :string
    field :champion_id, :id
    field :reviewer_id, :id
    field :timeframe, :timeframe
    field :targets, list_of(:create_target_input)
    field :description, :string
    field :parent_goal_id, :id
    field :anonymous_access_level, :integer
    field :company_access_level, :integer
    field :space_access_level, :integer
  end

  outputs do
    field :goal, :goal
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:space, fn ctx -> Group.get(ctx.me, id: inputs.space_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.request_info.access_level, :can_create_goal) end)
    |> run(:champion_validation, fn ctx -> validate_champion_permissions(ctx.me, inputs) end)
    |> run(:reviewer_validation, fn ctx -> validate_reviewer_permissions(ctx.me, inputs) end)
    |> run(:operation, fn ctx -> GoalCreation.run(ctx.me, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{goal: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :champion_validation, _} -> {:error, :bad_request, "The selected champion doesn't have access to the selected space"}
      {:error, :reviewer_validation, _} -> {:error, :bad_request, "The selected reviewer doesn't have access to the selected space"}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp validate_champion_permissions(me, inputs) when me.id == inputs.champion_id, do: {:ok, nil}
  defp validate_champion_permissions(_, inputs) do
    Group.get(inputs.champion_id, id: inputs.space_id)
  end

  defp validate_reviewer_permissions(me, inputs) when me.id == inputs.reviewer_id, do: {:ok, nil}
  defp validate_reviewer_permissions(_, inputs) do
    Group.get(inputs.reviewer_id, id: inputs.space_id)
  end
end
