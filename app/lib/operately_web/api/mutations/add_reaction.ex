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
    ResourceHubs,
  }
  alias Operately.Goals.Update
  alias Operately.Messages.Message
  alias Operately.Projects.Retrospective
  alias Operately.ResourceHubs.{Document, File, Link}
  alias Operately.Operations.ReactionAdding

  inputs do
    field :entity_id, :id
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
    |> run(:parent, fn ctx -> fetch_parent(inputs.entity_id, ctx.me, type, parent_type) end)
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
      :resource_hub_document -> Document.get(person, id: id)
      :resource_hub_file -> File.get(person, id: id)
      :resource_hub_link -> Link.get(person, id: id)
    end
  end

  defp check_permissions(parent, type, parent_type) do
    case type do
      :project_check_in -> Projects.Permissions.check(parent.requester_access_level, :can_comment_on_check_in)
      :project_retrospective -> Projects.Permissions.check(parent.request_info.access_level, :can_comment_on_retrospective)
      :comment_thread -> Activities.Permissions.check(parent.activity.requester_access_level, :can_comment_on_thread)
      :goal_update -> Goals.Update.Permissions.check(parent.request_info.access_level, parent, parent.request_info.requester.id, :can_comment)
      :message -> Groups.Permissions.check(parent.request_info.access_level, :can_comment_on_discussions)
      :comment -> check_comment_permissions(parent, parent_type)
      :resource_hub_document -> ResourceHubs.Permissions.check(parent.request_info.access_level, :can_comment_on_document)
      :resource_hub_file -> ResourceHubs.Permissions.check(parent.request_info.access_level, :can_comment_on_file)
      :resource_hub_link -> ResourceHubs.Permissions.check(parent.request_info.access_level, :can_comment_on_link)
    end
  end

  defp check_comment_permissions(parent, type) do
    case type do
      :project_check_in -> Projects.Permissions.check(parent.requester_access_level, :can_comment_on_check_in)
      :project_retrospective -> Projects.Permissions.check(parent.requester_access_level, :can_comment_on_retrospective)
      :comment_thread -> Activities.Permissions.check(parent.requester_access_level, :can_comment_on_thread)
      :goal_update -> Goals.Update.Permissions.check(parent.request_info.access_level, parent, parent.request_info.requester.id, :can_comment)
      :message -> Groups.Permissions.check(parent.requester_access_level, :can_comment_on_discussions)
      :milestone -> Projects.Permissions.check(parent.requester_access_level, :can_comment_on_milestone)
      :resource_hub_document -> ResourceHubs.Permissions.check(parent.requester_access_level, :can_comment_on_document)
      :resource_hub_file -> ResourceHubs.Permissions.check(parent.requester_access_level, :can_comment_on_file)
      :resource_hub_link -> ResourceHubs.Permissions.check(parent.requester_access_level, :can_comment_on_link)
    end
  end

  defp execute(ctx, inputs) do
    ReactionAdding.run(ctx.me, inputs.entity_id, inputs.entity_type, inputs.emoji)
  end

  defp parse_comment_parent(nil), do: :ok
  defp parse_comment_parent(parent_type) do
    String.to_existing_atom(parent_type)
  end
end
