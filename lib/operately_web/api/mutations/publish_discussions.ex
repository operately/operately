defmodule OperatelyWeb.Api.Mutations.PublishDiscussion do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Messages.Message
  alias Operately.Operations.DiscussionPublishing

  inputs do
    field :id, :id
  end

  outputs do
    field :discussion, :discussion
  end

  def call(conn, inputs) do
    with(
      {:ok, me} <- find_me(conn),
      {:ok, discussion} <- Message.get(me, id: inputs.id, opts: [preload: :space]),
      {:ok, :allowed} <- authorize(me, discussion),
      {:ok, discussion} <- publish(me, discussion)
    ) do
      {:ok, %{discussion: Serializer.serialize(discussion, level: :essential)}}
    else
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
      _ -> {:error, :internal_server_error}
    end
  end

  defp authorize(me, discussion) do
    cond do
      discussion.state != :draft -> {:error, :forbidden}
      discussion.author_id != me.id -> {:error, :forbidden}
      true -> {:ok, :allowed}
    end
  end

  defp publish(me, discussion) do
    DiscussionPublishing.run(me, discussion)
  end

end
