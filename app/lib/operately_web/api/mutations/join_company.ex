defmodule OperatelyWeb.Api.Mutations.JoinCompany do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.{People, Invitations}

  inputs do
    field :token, :string
    field :password, :string
    field :password_confirmation, :string
  end

  outputs do
    field :result, :string
  end

  def call(_conn, inputs) do
    with {:ok, invitation} <- find_invitation(inputs[:token]),
         {:ok, result} <- process_invitation(invitation, inputs) do
      {:ok, %{result: result}}
    end
  end

  defp find_invitation(token) do
    case Invitations.get_invitation_by_token(token) do
      nil -> {:error, :bad_request, "Invalid token"}
      invitation -> {:ok, invitation}
    end
  end

  defp process_invitation(invitation, inputs) do
    if People.account_has_active_person?(invitation.member.account_id) do
      {:ok, _} = People.update_person(invitation.member, %{has_open_invitation: false})
      {:ok, "Successfully joined company"}
    else
      process_password_change(inputs, invitation)
    end
  end

  defp process_password_change(inputs, invitation) do
    if inputs.password == inputs.password_confirmation do
      Operately.Operations.PasswordFirstTimeChanging.run(inputs, invitation)
      {:ok, "Password successfully changed"}
    else
      {:error, :bad_request, "Passwords don't match"}
    end
  end
end
