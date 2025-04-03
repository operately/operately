defmodule OperatelyWeb.Api.Queries.GetInvitation do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :token, :string
  end

  outputs do
    field :invitation, :invitation
    field :reset_password, :boolean
  end

  def call(_conn, inputs) do
    invitation = Operately.Invitations.get_invitation_by_token(inputs[:token])
    invitation = Operately.Repo.preload(invitation, [:admin, :company])

    {:ok, %{
      invitation: Serializer.serialize(invitation, level: :essential),
      reset_password: invitation && not Operately.People.account_has_active_person?(invitation.member.account_id),
    }}
  end
end
