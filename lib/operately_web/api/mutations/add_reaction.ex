defmodule OperatelyWeb.Api.Mutations.AddReaction do
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
  alias Operately.Goals.Update
  alias Operately.Messages.Message
  alias Operately.Projects.Retrospective
  alias Operately.Operations.ReactionAdding

  inputs do
    field :entity_id, :string
    field :entity_type, :string
    field :parent_type, :string
    field :emoji, :string
  end

  outputs do
    field :reaction, :reaction
  end

  def call(conn, inputs) do
    type = String.to_existing_atom(inputs.entity_type)
    parent_type = parse_comment_parent(inputs[:parent_type])

    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.entity_id) end)
    |> run(:parent, fn ctx -> fetch_parent(ctx.id, ctx.me, type, parent_type) end)
    |> run(:check_permissions, fn ctx -> check_permissions(ctx.parent, type, parent_type) end)
    |> run(:operation, fn ctx -> execute(ctx, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{reaction: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :parent, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp fetch_parent(id, person, type, parent_type) do
    case type do
      :project_check_in -> Projects.get_check_in_with_access_level(id, person.id)
      :project_retrospective -> Retrospective.get(person, id: id)
      :comment_thread -> Comments.get_thread_with_activity_and_access_level(id, person.id)
      :goal_update -> Update.get(person, id: id)
      :message -> Message.get(person, id: id)
      :comment -> Updates.get_comment_with_access_level(id, person.id, parent_type)
    end
  end

  defp check_permissions(parent, type, parent_type) do
    case type do
      :project_check_in -> Projects.Permissions.check(parent.requester_access_level, :can_comment_on_check_in)
      :project_retrospective -> Projects.Permissions.check(parent.request_info.access_level, :can_comment_on_retrospective)
      :comment_thread -> Activities.Permissions.check(parent.activity.requester_access_level, :can_comment_on_thread)
      :goal_update -> Goals.Permissions.check(parent.request_info.access_level, :can_comment_on_update)
      :message -> Groups.Permissions.check(parent.request_info.access_level, :can_comment_on_discussions)
      :comment -> check_comment_permissions(parent, parent_type)
    end
  end

  defp check_comment_permissions(parent, type) do
    case type do
      :project_check_in -> Projects.Permissions.check(parent.requester_access_level, :can_comment_on_check_in)
      :comment_thread -> Activities.Permissions.check(parent.requester_access_level, :can_comment_on_thread)
      :goal_update -> Goals.Permissions.check(parent.requester_access_level, :can_comment_on_update)
      :message -> Groups.Permissions.check(parent.requester_access_level, :can_comment_on_discussions)
      :milestone -> Projects.Permissions.check(parent.requester_access_level, :can_comment_on_milestone)
    end
  end

  defp execute(ctx, inputs) do
    ReactionAdding.run(ctx.me, ctx.id, inputs.entity_type, inputs.emoji)
  end

  defp parse_comment_parent(nil), do: :ok
  defp parse_comment_parent(parent_type) do
    String.to_existing_atom(parent_type)
  end
end
