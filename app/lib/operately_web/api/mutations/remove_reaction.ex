defmodule OperatelyWeb.Api.Mutations.RemoveReaction do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.{
    Activities,
    Projects,
    Updates,
    Goals,
    Groups,
    ResourceHubs
  }

  alias Operately.Goals.Update
  alias Operately.Messages.Message
  alias Operately.Projects.Retrospective
  alias Operately.ResourceHubs.{Document, File, Link}
  alias Operately.Operations.ReactionRemoving
  alias Operately.Comments.CommentThread

  inputs do
    field? :entity_id, :id, null: true
    field? :entity_type, :string, null: true
    field? :parent_type, :string, null: true
    field? :emoji, :string, null: true
  end

  outputs do
    field? :success, :boolean, null: true
  end

  def call(conn, inputs) do
    type = String.to_existing_atom(inputs.entity_type)
    parent_type = parse_comment_parent(inputs[:parent_type])

    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:parent, fn ctx -> fetch_parent(inputs.entity_id, ctx.me, type, parent_type) end)
    |> run(:check_permissions, fn ctx -> check_permissions(ctx.parent, type, parent_type, ctx.me) end)
    |> run(:operation, fn ctx -> execute(ctx, inputs) end)
    |> run(:serialized, fn _ -> {:ok, %{success: true}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :parent, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, {:error, :reaction_not_found}} -> {:error, :not_found}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp fetch_parent(id, person, type, parent_type) do
    case type do
      :project_check_in -> Projects.get_check_in_with_access_level(id, person.id)
      :project_retrospective -> Retrospective.get(person, id: id)
      :comment_thread -> CommentThread.get(person, id: id, opts: [preload: :activity])
      :goal_update -> Update.get(person, id: id)
      :message -> Message.get(person, id: id)
      :comment -> Updates.get_comment_with_access_level(id, person.id, parent_type)
      :resource_hub_document -> Document.get(person, id: id)
      :resource_hub_file -> File.get(person, id: id)
      :resource_hub_link -> Link.get(person, id: id)
    end
  end

  defp check_permissions(parent, type, parent_type, me) do
    case type do
      :project_check_in -> Projects.Permissions.check(parent.request_info.access_level, :can_comment_on_check_in)
      :project_retrospective -> Projects.Permissions.check(parent.request_info.access_level, :can_comment_on_retrospective)
      :comment_thread -> Activities.Permissions.check(parent.request_info.access_level, :can_comment_on_thread)
      :goal_update -> Goals.Update.Permissions.check(parent.request_info.access_level, parent, parent.request_info.requester.id, :can_comment)
      :message -> Groups.Permissions.check(parent.request_info.access_level, :can_comment_on_discussions)
      :comment -> check_comment_permissions(parent, parent_type, me)
      :resource_hub_document -> ResourceHubs.Permissions.check(parent.request_info.access_level, :can_comment_on_document)
      :resource_hub_file -> ResourceHubs.Permissions.check(parent.request_info.access_level, :can_comment_on_file)
      :resource_hub_link -> ResourceHubs.Permissions.check(parent.request_info.access_level, :can_comment_on_link)
    end
  end

  defp check_comment_permissions(parent, type, me) do
    case type do
      :project_check_in -> Projects.Permissions.check(parent.requester_access_level, :can_comment_on_check_in)
      :project_retrospective -> Projects.Permissions.check(parent.requester_access_level, :can_comment_on_retrospective)
      :comment_thread -> Activities.Permissions.check(parent.requester_access_level, :can_comment_on_thread)
      :goal_update -> Goals.Update.Permissions.check(parent.requester_access_level, parent.entity_id, me.id, :can_comment)
      :message -> Groups.Permissions.check(parent.requester_access_level, :can_comment_on_discussions)
      :milestone -> Projects.Permissions.check(parent.requester_access_level, :can_comment_on_milestone)
      :resource_hub_document -> ResourceHubs.Permissions.check(parent.requester_access_level, :can_comment_on_document)
      :resource_hub_file -> ResourceHubs.Permissions.check(parent.requester_access_level, :can_comment_on_file)
      :resource_hub_link -> ResourceHubs.Permissions.check(parent.requester_access_level, :can_comment_on_link)
    end
  end

  defp execute(ctx, inputs) do
    ReactionRemoving.run(ctx.me, inputs.entity_id, inputs.entity_type, inputs.emoji)
  end

  defp parse_comment_parent(nil), do: :ok

  defp parse_comment_parent(parent_type) do
    String.to_existing_atom(parent_type)
  end
end