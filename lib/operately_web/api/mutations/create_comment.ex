defmodule OperatelyWeb.Api.Mutations.CreateComment do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.{
    Activities,
    Comments,
    Projects,
    Updates,
    Goals,
    Groups,
  }
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
    |> run(:operation, fn ctx -> execute(ctx, inputs, type) end)
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

  defp fetch_parent(person_id, id, type) do
    case type do
      :project_check_in -> Projects.get_check_in_with_access_level(id, person_id)
      :comment_thread -> Comments.get_thread_with_activity_and_access_level(id, person_id)
      :goal_update -> Goals.get_check_in(person_id, id)
      :discussion -> Updates.get_update_with_space_and_access_level(id, person_id)
    end
  end

  defp check_permissions(parent, type) do
    case type do
      :project_check_in -> Projects.Permissions.check(parent.requester_access_level, :can_comment_on_check_in)
      :comment_thread -> Activities.Permissions.check(parent.activity.requester_access_level, :can_comment_on_thread)
      :goal_update -> Goals.Permissions.check(parent.requester_access_level, :can_comment_on_update)
      :discussion -> Groups.Permissions.check(parent.space.requester_access_level, :can_comment_on_discussions)
    end
  end

  defp execute(ctx, inputs, type) do
    case type do
      :discussion -> CommentAdding.run(ctx.me, ctx.parent, "update", ctx.content)
      _ -> CommentAdding.run(ctx.me, ctx.parent, inputs.entity_type, ctx.content)
    end
  end
end
