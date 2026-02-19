defmodule OperatelyWeb.Api.Mutations.CreateComment do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.{
    Activities,
    Projects,
    Goals,
    Groups,
    ResourceHubs
  }

  alias Operately.Goals.Update
  alias Operately.Messages.Message
  alias Operately.ResourceHubs.{Document, File, Link}
  alias Operately.Projects.{CheckIn, Retrospective}
  alias Operately.Tasks.Task
  alias Operately.Operations.CommentAdding
  alias Operately.Comments.CommentThread

  inputs do
    field :entity_id, :id, null: false
    field :entity_type, :comment_parent_type, null: false
    field :content, :string, null: false
  end

  outputs do
    field :comment, :comment, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:content, fn -> Jason.decode(inputs.content) end)
    |> run(:parent, fn ctx -> fetch_parent(ctx.me, inputs.entity_id, inputs.entity_type) end)
    |> run(:check_permissions, fn ctx -> check_permissions(ctx.parent, inputs.entity_type) end)
    |> run(:operation, fn ctx -> execute(ctx, inputs) end)
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

  defp fetch_parent(person, id, type) do
    case type do
      :project_check_in -> CheckIn.get(person, id: id, opts: [preload: :project])
      :project_retrospective -> Retrospective.get(person, id: id, opts: [preload: :project])
      :comment_thread -> CommentThread.get(person, id: id, opts: [preload: :activity])
      :goal_update -> Update.get(person, id: id, opts: [preload: :goal])
      :message -> Message.get(person, id: id, opts: [preload: :space])
      :resource_hub_document -> Document.get(person, id: id, opts: [preload: [:resource_hub, :node]])
      :resource_hub_file -> File.get(person, id: id, opts: [preload: [:resource_hub, :node]])
      :resource_hub_link -> Link.get(person, id: id, opts: [preload: [:resource_hub, :node]])
      :project_task -> Task.get(person, id: id, opts: [preload: :project])
      :space_task -> Task.get(person, id: id, opts: [preload: :space])
    end
  end

  defp check_permissions(parent, type) do
    case type do
      :project_check_in -> Projects.Permissions.check(parent.request_info.access_level, :can_comment)
      :project_retrospective -> Projects.Permissions.check(parent.request_info.access_level, :can_comment)
      :comment_thread -> Activities.Permissions.check(parent.request_info.access_level, :can_comment_on_thread)
      :goal_update -> Goals.Update.Permissions.check(parent.request_info.access_level, parent, parent.request_info.requester.id, :can_comment)
      :message -> Groups.Permissions.check(parent.request_info.access_level, :can_comment)
      :resource_hub_document -> ResourceHubs.Permissions.check(parent.request_info.access_level, :can_comment_on_document)
      :resource_hub_file -> ResourceHubs.Permissions.check(parent.request_info.access_level, :can_comment_on_file)
      :resource_hub_link -> ResourceHubs.Permissions.check(parent.request_info.access_level, :can_comment_on_link)
      :project_task -> Projects.Permissions.check(parent.request_info.access_level, :can_comment)
      :space_task -> Groups.Permissions.check(parent.request_info.access_level, :can_comment)
    end
  end

  defp execute(ctx, inputs) do
    CommentAdding.run(ctx.me, ctx.parent, inputs.entity_type, ctx.content)
  end
end
