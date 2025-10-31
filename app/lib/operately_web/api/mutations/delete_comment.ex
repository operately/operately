defmodule OperatelyWeb.Api.Mutations.DeleteComment do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Updates
  alias Operately.Operations.CommentDeleting

  inputs do
    field(:comment_id, :id, null: false)
    field(:parent_type, :comment_parent_type, null: false)
  end

  outputs do
    field(:comment, :comment, null: false)
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:comment, fn ctx ->
      Updates.get_comment_with_access_level(inputs.comment_id, ctx.me.id, inputs.parent_type)
    end)
    |> run(:check_permissions, fn ctx -> check_permissions(ctx.me, ctx.comment) end)
    |> run(:operation, fn ctx -> CommentDeleting.run(ctx.me, ctx.comment) end)
    |> run(:serialized, fn ctx ->
      {:ok, %{comment: Serializer.serialize(ctx.operation, level: :essential)}}
    end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :comment, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp check_permissions(author, comment) do
    if comment.author_id == author.id do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end
end
