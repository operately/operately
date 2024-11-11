defmodule OperatelyWeb.Api.Mutations.PostDiscussion do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups
  alias Operately.Groups.Permissions
  alias Operately.Operations.DiscussionPosting

  inputs do
    field :space_id, :id
    field :title, :string
    field :body, :string
    field :post_as_draft, :boolean

    field :send_notifications_to_everyone, :boolean
    field :subscriber_ids, list_of(:id)
  end

  outputs do
    field :discussion, :discussion
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:space, fn ctx -> Groups.get_group_with_access_level(ctx.attrs.space_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.requester_access_level, :can_post_discussions) end)
    |> run(:operation, fn ctx -> DiscussionPosting.run(ctx.me, ctx.space, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{discussion: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :space_id, _} -> {:error, :bad_request}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    {:ok, %{
      space_id: inputs.space_id,
      title: inputs.title,
      content: Jason.decode!(inputs.body),
      post_as_draft: inputs[:post_as_draft] || false,
      send_to_everyone: inputs[:send_notifications_to_everyone] || false,
      subscription_parent_type: :message,
      subscriber_ids: inputs[:subscriber_ids] || []
    }}
  end
end
