defmodule OperatelyWeb.Api.Goals.AcknowledgeCheckIn do
  @moduledoc """
  Acknowledges a goal check-in.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.Update
  alias Operately.Goals.Update.Permissions
  alias Operately.Operations.GoalUpdateAcknowledging

  require Logger

  inputs do
    field :id, :id, null: false
  end

  outputs do
    field? :update, :goal_progress_update, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:update, fn ctx -> Update.get(ctx.me, id: inputs.id, opts: [preload: :goal]) end)
    |> run(:check_published, fn ctx -> check_published(ctx.update) end)
    |> run(:check_permissions, fn ctx -> Permissions.check_can_edit(ctx.update.request_info.access_level, company_read_only: company_read_only(conn)) end)
    |> run(:check_already_acknowledged, fn ctx -> check_already_acknowledged(ctx.update) end)
    |> run(:check_not_the_author, fn ctx -> check_not_the_author(ctx.me, ctx.update) end)
    |> run(:operation, fn ctx -> GoalUpdateAcknowledging.run(ctx.me, ctx.update) end)
    |> run(:serialized, fn ctx -> {:ok, %{update: Serializer.serialize(ctx.operation, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} ->
        {:ok, ctx.serialized}

      {:error, :check_already_acknowledged, e} ->
        {:ok, %{update: Serializer.serialize(e.context.update, level: :full)}}

      {:error, :id, _} ->
        {:error, :bad_request}

      {:error, :update, _} ->
        {:error, :not_found}

      {:error, :check_published, _} ->
        {:error, :not_found}

      {:error, :check_permissions, _} ->
        {:error, :forbidden}

      {:error, :check_not_the_author, _} ->
        {:error, :bad_request, "Authors cannot acknowledge their own check-ins"}

      {:error, :operation, _} ->
        {:error, :internal_server_error}

      e ->
        Logger.error("AcknowledgeGoalCheckIn mutation failed: #{inspect(e)}")
        {:error, :internal_server_error}
    end
  end

  defp check_already_acknowledged(update) do
    if update.acknowledged_at do
      {:error, :already_acknowledged}
    else
      {:ok, :can_acknowledge}
    end
  end

  defp check_not_the_author(me, update) do
    if me.id == update.author_id do
      {:error, :cant_acknowledge_own_check_in}
    else
      {:ok, :not_the_author}
    end
  end
end
