defmodule OperatelyWeb.Api.Goals.DeleteCheckIn do
  @moduledoc """
  Deletes a goal check-in.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.Update
  alias Operately.Goals.Update.Permissions
  alias Operately.Operations.GoalCheckInDeleting

  inputs do
    field :id, :id, null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:update, fn ctx -> Update.get(ctx.me, id: inputs.id, opts: [preload: :goal]) end)
    |> run(:check_draft_access, fn ctx -> check_draft_access(ctx.update, ctx.me) end)
    |> run(:check_permissions, fn ctx -> check_permissions(ctx.update, ctx.me, company_read_only(conn)) end)
    |> run(:operation, fn ctx -> GoalCheckInDeleting.run(ctx.update) end)
    |> run(:serialized, fn _ -> {:ok, %{success: true}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :update, _} -> {:error, :not_found}
      {:error, :check_draft_access, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp check_permissions(%{state: :draft, author_id: author_id}, %{id: author_id}, false), do: {:ok, :allowed}
  defp check_permissions(update, person, company_read_only), do: Permissions.check(update.request_info.access_level, update, person.id, :can_delete, company_read_only: company_read_only)
end
