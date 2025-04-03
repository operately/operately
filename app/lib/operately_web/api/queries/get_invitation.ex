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
    invitation = Operately.Repo.preload(invitation, [:member, :admin, :company])

    {:ok, %{invitation: Serializer.serialize(invitation, level: :essential)}}
  end
end
