defmodule OperatelyWeb.Api.Mutations.ArchiveMessage do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Operations.MessageArchiving
  alias Operately.Messages.Permissions
  alias Operately.Messages.Message

  inputs do
    field? :message_id, :id, null: true
  end

  def call(conn, inputs) do
    with(
      {:ok, me} <- find_me(conn),
      {:ok, message} <- Message.get(me, id: inputs.message_id),
      {:ok, :allowed} <- Permissions.check(me, message, :can_archive_message),
      {:ok, _} <- MessageArchiving.run(me, message)
    ) do
      {:ok, %{}}
    else
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, :not_found} -> {:error, :not_found}
      {:error, _} -> {:error, :internal_server_error}
    end
  end
end
