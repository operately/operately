defmodule OperatelyWeb.Api.Queries.GetInvitation do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :token, :string
  end

  outputs do
    field :invitation, :invitation
  end

  def call(_conn, inputs) do
    invitation = Operately.Invitations.get_invitation_by_token(inputs[:token])
    invitation = Operately.Repo.preload(invitation, [:member, :admin])

    {:ok, %{invitation: Serializer.serialize(invitation)}}
  end
end
