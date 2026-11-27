defmodule OperatelyWeb.Api.Spaces.PublishDiscussion do
  @moduledoc """
  Publishes a space discussion draft.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Messages.Message
  alias Operately.Operations.DiscussionPublishing

  inputs do
    field :id, :id, null: false
  end

  outputs do
    field :discussion, :discussion, null: false
  end

  def call(conn, inputs) do
    with(
      {:ok, me} <- find_me(conn),
      {:ok, discussion} <- Message.get(me, id: inputs.id, opts: [getter_profile: :space_discussion]),
      {:ok, discussion} <- DiscussionPublishing.run(me, discussion)
    ) do
      {:ok, %{discussion: Serializer.serialize(discussion, level: :essential)}}
    else
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
      _ -> {:error, :internal_server_error}
    end
  end
end
