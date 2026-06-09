defmodule OperatelyWeb.Api.Goals.AcknowledgeCheckIn do
  @moduledoc """
  Acknowledges a goal check-in.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.Update
  alias Operately.Goals.Update.Permissions
  alias Operately.Operations.GoalUpdateAcknowledging

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
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.update.request_info.access_level, ctx.update, ctx.me.id, :can_acknowledge, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> GoalUpdateAcknowledging.run(ctx.me, ctx.update) end)
    |> run(:serialized, fn ctx -> {:ok, %{update: Serializer.serialize(ctx.operation, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :update, _} -> {:error, :not_found}
      {:error, :check_published, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp check_published(%{state: :published}), do: {:ok, :published}
  defp check_published(_update), do: {:error, :draft}
end
