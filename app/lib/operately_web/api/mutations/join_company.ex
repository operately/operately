defmodule OperatelyWeb.Api.Mutations.JoinCompany do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :token, :string, null: false
    field :password, :string, null: false
    field :password_confirmation, :string, null: false
  end

  outputs do
    field :result, :string, null: false
  end

  def call(_conn, inputs) do
    case validate(inputs) do
      {:ok, invite_link} ->
        Operately.Operations.PasswordFirstTimeChanging.run(inputs, invite_link)
        {:ok, %{result: "Password successfully changed"}}
      {:error, reason} ->
        {:error, :bad_request, reason}
    end
  end

  defp validate(inputs) do
    cond do
      inputs.password != inputs.password_confirmation ->
        {:error, "Passwords don't match"}
      true ->
        with(
          {:ok, invite_link} <- Operately.InviteLinks.get_personal_invite_link_by_token(inputs.token, preload: [:person]),
          {:ok, _invite_link} <- Operately.InviteLinks.validate_personal_invite_link(invite_link),
          true <- invite_link.person && invite_link.person.has_open_invitation
        ) do
          {:ok, invite_link}
        else
          _ -> {:error, "Invalid token"}
        end
    end
  end
end
