defmodule OperatelyWeb.Api.Mutations.NewInvitationToken do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies
  alias Operately.Companies.Permissions

  inputs do
    field :person_id, :string
  end

  outputs do
    field :invitation, :invitation
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:company, fn ctx -> Companies.get_company_with_access_level(ctx.me.id, id: ctx.me.company_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.company.requester_access_level, :can_invite_members) end)
    |> run(:operation, fn ctx -> execute(ctx.me, inputs) end)
    |> run(:serialized, fn ctx -> serialize(ctx.operation) end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :company, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, %{error: [message: message]}} -> {:error, :bad_request, message}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp execute(admin, inputs) do
    {:ok, id} = decode_id(inputs.person_id)

    case Operately.Invitations.get_invitation_by_member(id) do
      nil -> {:error, message: "This member didn't join the company using an invitation token."}
      invitation -> create_token(admin, invitation)
    end
  end

  defp create_token(admin, invitation) do
    {:ok, _} = Operately.Operations.CompanyInvitationTokenCreation.run(admin, invitation)

    value = Operately.Invitations.InvitationToken.build_token()

    {:ok, token} = Operately.Invitations.create_invitation_token!(%{
      token: value,
      invitation_id: invitation.id,
    })
    token = %{token | token: value}

    invitation =
      from(i in Operately.Invitations.Invitation,
        where: i.id == ^invitation.id,
        preload: [:member, :invitation_token, :admin]
      )
      |> Repo.one()

    {:ok, %{invitation | invitation_token: token}}
  end

  defp serialize(invitation) do
    {:ok, %{invitation: Serializer.serialize(invitation, level: :full)}}
  end
end
