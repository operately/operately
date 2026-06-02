defmodule OperatelyWeb.Api.Spaces.ArchiveDiscussion do
  @moduledoc """
  Archives a space discussion.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Operations.MessageArchiving
  alias Operately.Messages.Permissions
  alias Operately.Messages.Message

  inputs do
    field :id, :id, null: false
  end

  def call(conn, inputs) do
    with(
      {:ok, me} <- find_me(conn),
      {:ok, message} <- Message.get(me, id: inputs.id),
      {:ok, :allowed} <- Permissions.check(me, message, :can_archive_message, company_read_only: company_read_only(conn)),
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
