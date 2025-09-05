defmodule OperatelyWeb.Api.Mutations.RemoveReaction do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :reaction_id, :id
  end

  outputs do
    field :success, :boolean
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:reaction, fn -> fetch_reaction(inputs.reaction_id) end)
    |> run(:check_permissions, fn ctx -> check_permissions(ctx.reaction, ctx.me) end)
    |> run(:operation, fn ctx -> execute(ctx) end)
    |> run(:serialized, fn _ -> {:ok, %{success: true}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :reaction, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, {:error, :reaction_not_found}} -> {:error, :not_found}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp fetch_reaction(id) do
    case Operately.Updates.get_reaction(id) do
      nil -> {:error, :not_found}
      reaction -> reaction
    end
  end

  defp check_permissions(reaction, me) do
    if reaction.person_id == me.id do
      {:ok, :authorized}
    else
      {:error, :not_authorized}
    end
  end

  defp execute(ctx) do
    Repo.delete(ctx.reaction)
  end
end
