defmodule OperatelyWeb.Api.Queries.GetDiscussions do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Messages.Message
  alias Operately.Access.Filters

  inputs do
    field :space_id, :id
    field :include_author, :boolean
    field :include_comments_count, :boolean
  end

  outputs do
    field :discussions, list_of(:discussion)
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn) do
      messages = load_messages(me, inputs)
      {:ok, %{discussions: Serializer.serialize(messages, level: :essential)}}
    else
      _ -> {:error, :internal_server_error}
    end
  end

  defp load_messages(me, inputs) do
    from(m in Message,
      join: b in assoc(m, :messages_board),
      where: b.space_id == ^inputs.space_id and m.state != :draft,
      preload: ^preload(inputs),
      order_by: [desc: m.inserted_at]
    )
    |> Filters.filter_by_view_access(me.id)
    |> Repo.all()
    |> after_load(inputs)
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
