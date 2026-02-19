defmodule OperatelyWeb.Api.Mutations.AddReaction do
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
  alias Operately.Operations.ReactionAdding
  alias Operately.Comments.CommentThread

  inputs do
    field :entity_id, :id, null: false
    field :entity_type, :reaction_entity_type, null: false
    field? :parent_type, :reaction_parent_type, null: false
    field :emoji, :string, null: false
  end

  outputs do
    field :reaction, :reaction, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:parent, fn ctx -> fetch_parent(inputs.entity_id, ctx.me, inputs.entity_type, inputs[:parent_type]) end)
    |> run(:check_permissions, fn ctx -> check_permissions(ctx.parent, inputs.entity_type, inputs[:parent_type], ctx.me) end)
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
      :project_check_in -> Projects.Permissions.check(parent.requester_access_level, :can_comment)
      :project_retrospective -> Projects.Permissions.check(parent.request_info.access_level, :can_comment)
      :comment_thread -> Activities.Permissions.check(parent.request_info.access_level, :can_comment_on_thread)
      :goal_update -> Goals.Update.Permissions.check(parent.request_info.access_level, parent, parent.request_info.requester.id, :can_comment)
      :message -> Groups.Permissions.check(parent.request_info.access_level, :can_comment)
      :comment -> check_comment_permissions(parent, parent_type, me)
      :resource_hub_document -> ResourceHubs.Permissions.check(parent.request_info.access_level, :can_comment_on_document)
      :resource_hub_file -> ResourceHubs.Permissions.check(parent.request_info.access_level, :can_comment_on_file)
      :resource_hub_link -> ResourceHubs.Permissions.check(parent.request_info.access_level, :can_comment_on_link)
    end
  end

  defp check_comment_permissions(parent, type, me) do
    case type do
      :project_check_in -> Projects.Permissions.check(parent.requester_access_level, :can_comment)
      :project_retrospective -> Projects.Permissions.check(parent.requester_access_level, :can_comment)
      :comment_thread -> Activities.Permissions.check(parent.requester_access_level, :can_comment_on_thread)
      :goal_update -> Goals.Update.Permissions.check(parent.requester_access_level, parent.entity_id, me.id, :can_comment)
      :message -> Groups.Permissions.check(parent.requester_access_level, :can_comment)
      :milestone -> Projects.Permissions.check(parent.requester_access_level, :can_comment)
      :project_task -> Projects.Permissions.check(parent.requester_access_level, :can_comment)
      :space_task -> Groups.Permissions.check(parent.requester_access_level, :can_comment)
      :resource_hub_document -> ResourceHubs.Permissions.check(parent.requester_access_level, :can_comment_on_document)
      :resource_hub_file -> ResourceHubs.Permissions.check(parent.requester_access_level, :can_comment_on_file)
      :resource_hub_link -> ResourceHubs.Permissions.check(parent.requester_access_level, :can_comment_on_link)
    end
  end

  defp execute(ctx, inputs) do
    entity_type = Atom.to_string(inputs.entity_type)
    ReactionAdding.run(ctx.me, inputs.entity_id, entity_type, inputs.emoji)
  end
end
