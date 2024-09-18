defmodule OperatelyWeb.Api.Queries.GetDiscussions do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Access.Filters

  inputs do
    field :space_id, :string
  end

  outputs do
    field :discussions, list_of(:discussion)
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.space_id) end)
    |> run(:messages, fn ctx -> load_messages(ctx.me, ctx.id) end)
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

  defp load_messages(person, space_id) do
    messages =
      from(m in Operately.Messages.Message,
        where: m.space_id == ^space_id,
        preload: :author,
        order_by: [desc: m.inserted_at]
      )
      |> Filters.filter_by_view_access(person.id)
      |> Repo.all()

    {:ok, messages}
  end
end
