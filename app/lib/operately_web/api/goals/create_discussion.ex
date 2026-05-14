defmodule OperatelyWeb.Api.Goals.CreateDiscussion do
  @moduledoc """
  Creates a new discussion for a goal.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.{Goal, Permissions}
  alias Operately.Operations.GoalDiscussionCreation
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :goal_id, :id, null: false
    field :title, :string, null: false
    field :message, :json, null: false
    field? :send_notifications_to_everyone, :boolean, null: false, default: false, external_default: true
    field? :subscriber_ids, list_of(:id), null: false, default: []
  end

  outputs do
    field :discussion, :comment_thread
    field :activity_id, :string
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:goal, fn ctx -> Goal.get(ctx.me, id: inputs.goal_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.goal.request_info.access_level, :can_edit) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:operation, fn ctx -> GoalDiscussionCreation.run(ctx.me, ctx.goal, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{
      discussion: Serializer.serialize(ctx.operation.comment_thread, level: :essential),
      activity_id: OperatelyWeb.Paths.activity_id(ctx.operation),
    }} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :goal, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    {:ok, %{
      title: inputs.title,
      content: inputs.message,
      subscription_parent_type: :comment_thread,
      send_to_everyone: inputs[:send_notifications_to_everyone],
      subscriber_ids: inputs[:subscriber_ids]
    }}
  end
end
