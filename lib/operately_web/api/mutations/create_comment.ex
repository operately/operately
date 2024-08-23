defmodule OperatelyWeb.Api.Mutations.CreateComment do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Operations.CommentAdding

  inputs do
    field :entity_id, :string
    field :entity_type, :string
    field :content, :string
  end

  outputs do
    field :comment, :comment
  end

  def call(conn, inputs) do
    type = String.to_existing_atom(inputs.entity_type)

    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.entity_id) end)
    |> run(:content, fn -> Jason.decode(inputs.content) end)
    |> run(:parent, fn ctx -> fetch_parent(ctx.me.id, ctx.id, type) end)
    |> run(:check_permissions, fn ctx -> check_permissions(ctx.parent, type) end)
    |> run(:operation, fn ctx -> CommentAdding.run(ctx.me, ctx.id, inputs.entity_type, ctx.content) end)
    |> run(:serialized, fn ctx -> {:ok, %{comment: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :content, _} -> {:error, :bad_request}
      {:error, :parent, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp check_permissions(parent, type) do
    case type do
      :project_check_in -> Projects.Permissions.check(parent.requester_access_level, :can_comment_on_check_in)
    end
  end

  defp fetch_parent(person_id, id, :project_check_in) do
    Projects.get_check_in_with_access_level(id, person_id)
  end
end
