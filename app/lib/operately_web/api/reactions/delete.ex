defmodule OperatelyWeb.Api.Reactions.Delete do
  @moduledoc """
  Deletes a reaction.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Updates.Reaction

  inputs do
    field :reaction_id, :id, null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:reaction, fn ctx -> Reaction.get(ctx.me, inputs.reaction_id) end)
    |> run(:operation, fn ctx -> Repo.delete(ctx.reaction) end)
    |> run(:serialized, fn _ -> {:ok, %{success: true}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :not_found} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end
end
