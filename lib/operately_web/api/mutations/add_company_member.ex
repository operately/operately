defmodule OperatelyWeb.Api.Mutations.AddCompanyMember do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  require Logger
  import Operately.Access.Filters, only: [filter_by_full_access: 2]

  inputs do
    field :full_name, :string
    field :email, :string
    field :title, :string
  end

  outputs do
    field :invitation, :invitation
  end

  def call(conn, inputs) do
    person = me(conn)

    if has_permissions?(person) do
      case create_invitation(person, inputs) do
        {:ok, invitation} ->
          {:ok, %{invitation: OperatelyWeb.Api.Serializer.serialize(invitation, level: :full)}}
        {:error, :bad_request, message} ->
          {:error, :bad_request, message}
      end
    else
      {:error, :forbidden}
    end
  end

  defp has_permissions?(person) do
    from(c in Operately.Companies.Company, where: c.id == ^person.company_id)
    |> filter_by_full_access(person.id)
    |> Repo.exists?()
  end

  defp create_invitation(person, inputs) do
    case Operately.Operations.CompanyMemberAdding.run(person, inputs) do
      {:ok, invitation} ->
        value = Operately.Invitations.InvitationToken.build_token()

        {:ok, token} = Operately.Invitations.create_invitation_token!(%{
          token: value,
          invitation_id: invitation.id,
        })

        invitation = Repo.one(
          from i in Operately.Invitations.Invitation,
            where: i.id == ^invitation.id,
            preload: [:member, :invitation_token, :admin]
        )

        # the token is a virtual field, so we need to update the struct after reaload
        token = %{token | token: value}
        invitation = %{invitation | invitation_token: token}
        {:ok, invitation}

      {:error, [%{field: :email, message: message}]} ->
        {:error, :bad_request, "Email " <> message}

      {:error, [%{field: :full_name, message: message}]} ->
        {:error, :bad_request, "Name " <> message}

      {:error, e} ->
        Logger.error("Unexpected error: #{inspect(e)}")
        raise "Unexpected error"
    end
  end
end
