defmodule OperatelyWeb.Api.Goals.Create do
  @moduledoc """
  Creates a new goal in a space.
  """

  use Gettext, backend: OperatelyWeb.Gettext
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups.{Group, Permissions}
  alias Operately.Access.Binding
  alias Operately.Operations.GoalCreation
  alias Operately.People

  inputs do
    field :space_id, :id, null: false
    field :name, :string, null: false
    field? :champion_id, :id, null: true
    field? :reviewer_id, :id, null: true
    field? :timeframe, :timeframe, null: true
    field? :targets, list_of(:create_target_input), null: true
    field? :description, :json, null: true
    field? :parent_goal_id, :id, null: true
    field :anonymous_access_level, :access_options_int, null: false
    field :company_access_level, :access_options_int, null: false
    field :space_access_level, :access_options_int, null: false
  end

  outputs do
    field? :goal, :goal, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:space, fn ctx -> Group.get(ctx.me, id: inputs.space_id, company_id: ctx.me.company_id) end)
    |> run(:inputs, fn ctx -> {:ok, sanitize_company_access_level(ctx.space, inputs)} end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)) end)
    |> run(:owners, fn ctx -> validate_owners(ctx.space, inputs) end)
    |> run(:champion_validation, fn ctx -> validate_champion_permissions(ctx.me, inputs) end)
    |> run(:reviewer_validation, fn ctx -> validate_reviewer_permissions(ctx.me, inputs) end)
    |> run(:parent_goal, fn ctx -> load_parent_goal(ctx.me, ctx.space.company_id, inputs[:parent_goal_id]) end)
    |> run(:operation, fn ctx -> GoalCreation.run(ctx.me, ctx.inputs, OperatelyWeb.Analytics.context(conn)) end)
    |> run(:serialized, fn ctx -> {:ok, %{goal: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :owners, _} -> {:error, :bad_request}
      {:error, :champion_validation, _} -> {:error, :bad_request, gettext("The selected champion doesn't have access to the selected space")}
      {:error, :reviewer_validation, _} -> {:error, :bad_request, gettext("The selected reviewer doesn't have access to the selected space")}
      {:error, :parent_goal, _} -> {:error, :not_found}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load_parent_goal(_me, _company_id, nil), do: {:ok, nil}
  defp load_parent_goal(me, company_id, id), do: Operately.Goals.Goal.get(me, id: id, company_id: company_id)

  defp validate_owners(space, inputs) do
    case People.validate_active_company_members(space.company_id, [inputs[:champion_id], inputs[:reviewer_id]]) do
      :ok -> {:ok, :valid}
      {:error, :invalid_company_member} = error -> error
    end
  end

  defp validate_champion_permissions(me, inputs) do
    cond do
      inputs[:champion_id] == nil -> {:ok, nil}
      me.id == inputs.champion_id -> {:ok, nil}
      true -> Group.get(inputs.champion_id, id: inputs.space_id)
    end
  end

  defp validate_reviewer_permissions(me, inputs) do
    cond do
      inputs[:reviewer_id] == nil -> {:ok, nil}
      me.id == inputs.reviewer_id -> {:ok, nil}
      true -> Group.get(inputs.reviewer_id, id: inputs.space_id)
    end
  end

  defp sanitize_company_access_level(space, inputs) do
    space = Operately.Groups.Group.preload_access_levels(space)

    if space.access_levels.company == Binding.no_access() do
      Map.put(inputs, :company_access_level, Binding.no_access())
    else
      inputs
    end
  end
end
