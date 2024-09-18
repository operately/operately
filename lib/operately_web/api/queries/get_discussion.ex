defmodule OperatelyWeb.Api.Queries.GetDiscussion do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Messages.Message
  alias Operately.Groups.Permissions

  inputs do
    field :id, :string
    field :include_author, :boolean
    field :include_comments, :boolean
    field :include_reactions, :boolean
    field :include_space, :boolean
  end

  outputs do
    field :discussion, :discussion
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.id) end)
    |> run(:preload, fn -> include_requested(inputs) end)
    |> run(:message, fn ctx -> load(ctx) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.message.request_info.access_level, :can_view_message) end)
    |> run(:serialized, fn ctx -> {:ok, %{discussion: OperatelyWeb.Api.Serializer.serialize(ctx.message, level: :full)}} end)
    |> respond()
   end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :message, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :not_found}
      _ -> {:error, :not_found}
    end
  end

  defp load(ctx) do
    Message.get(ctx.me, id: ctx.id, opts: [
      preload: ctx.preload,
    ])
  end

  defp include_requested(inputs) do
    requested = extract_include_filters(inputs)

    preload =
      Enum.reduce(requested, [], fn include, result ->
        case include do
          :include_author -> [:author | result]
          :include_comments -> [[comments: [:author, [reactions: :person]]] | result]
          :include_reactions -> [[reactions: :person] | result]
          :include_space -> [:space | result]
          e -> raise "Unknown include filter: #{e}"
        end
      end)

    {:ok, preload}
  end
end
