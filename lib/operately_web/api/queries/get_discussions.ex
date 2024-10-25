defmodule OperatelyWeb.Api.Queries.GetDiscussions do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Messages.Message
  alias Operately.Access.Filters

  inputs do
    field :space_id, :string
    field :include_author, :boolean
    field :include_comments_count, :boolean
  end

  outputs do
    field :discussions, list_of(:discussion)
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.space_id) end)
    |> run(:messages, fn ctx -> load_messages(ctx, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{discussions: Serializer.serialize(ctx.messages, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :messages, _} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load_messages(ctx, inputs) do
    messages =
      from(m in Message,
        where: m.space_id == ^ctx.id,
        preload: ^preload(inputs),
        order_by: [desc: m.inserted_at]
      )
      |> Filters.filter_by_view_access(ctx.me.id)
      |> Repo.all()
      |> after_load(inputs)

    {:ok, messages}
  end

  defp preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_author: :author,
    ])
  end

  defp after_load(messages, inputs) do
    Inputs.parse_includes(inputs, [
      include_comments_count: &Message.load_comments_count/1,
    ])
    |> Enum.reduce(messages, fn hook, message ->
      hook.(message)
    end)
  end
end
