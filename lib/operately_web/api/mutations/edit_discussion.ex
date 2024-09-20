defmodule OperatelyWeb.Api.Mutations.EditDiscussion do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups.Permissions
  alias Operately.Operations.DiscussionEditing
  alias Operately.Messages.Message

  inputs do
    field :discussion_id, :string
    field :title, :string
    field :body, :string
  end

  outputs do
    field :discussion, :discussion
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:message, fn ctx -> Message.get(ctx.me, id: ctx.attrs.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.message.request_info.access_level, :can_edit_discussions) end)
    |> run(:operation, fn ctx -> DiscussionEditing.run(ctx.me, ctx.message, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{discussion: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :message, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    {:ok, id} = decode_id(inputs.discussion_id)

    {:ok, %{
      id: id,
      title: inputs.title,
      body: Jason.decode!(inputs.body),
    }}
  end
end
