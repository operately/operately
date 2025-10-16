defmodule OperatelyWeb.Api.Mutations.AddCompanyMember do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  require Logger
  import Operately.Access.Filters, only: [filter_by_edit_access: 2]
  alias Operately.People

  inputs do
    field? :full_name, :string, null: true
    field? :email, :string, null: true
    field? :title, :string, null: true
  end

  outputs do
    field? :invitation, :invitation, null: true
    field? :new_account, :boolean, null: true
  end

  def call(conn, inputs) do
    admin = me(conn)

    if admin_has_edit_access?(admin) do
      process_member_creation(admin, inputs)
    else
      {:error, :forbidden}
    end
  end

  defp admin_has_edit_access?(admin) do
    from(c in Operately.Companies.Company, where: c.id == ^admin.company_id)
    |> filter_by_edit_access(admin.id)
    |> Repo.exists?()
  end

  defp process_member_creation(admin, inputs) do
    case create_person(admin, inputs) do
      {:ok, nil} ->
        {:ok, %{invitation: nil, new_account: false}}

      {:ok, invitation} ->
        invitation_with_token = create_invitation_token(invitation)

        {:ok,
         %{
           invitation: OperatelyWeb.Api.Serializer.serialize(invitation_with_token, level: :full),
           new_account: true
         }}

      error ->
        error
    end
  end

  defp create_person(admin, inputs) do
    skip_invitation = not People.is_new_account?(inputs[:email])

    case Operately.Operations.CompanyMemberAdding.run(admin, inputs, skip_invitation) do
      {:ok, result} ->
        {:ok, result}

      {:error, [%{field: :email, message: message}]} ->
        {:error, :bad_request, "Email " <> message}

      {:error, [%{field: :full_name, message: message}]} ->
        {:error, :bad_request, "Name " <> message}

      {:error, [%{message: message}]} ->
        {:error, :bad_request, message}

      {:error, error} ->
        Logger.error("Unexpected error: #{inspect(error)}")
        raise "Unexpected error"
    end
  end

  defp create_invitation_token(invitation) do
    token_value = Operately.Invitations.InvitationToken.build_token()

    {:ok, token} =
      Operately.Invitations.create_invitation_token!(%{
        token: token_value,
        invitation_id: invitation.id
      })

    invitation = Repo.preload(invitation, [:member, :admin])

    # The token is a virtual field, so we need to update the struct after reload
    updated_token = %{token | token: token_value}
    %{invitation | invitation_token: updated_token}
  end
end
