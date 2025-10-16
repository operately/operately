defmodule OperatelyWeb.Api.Mutations.JoinCompany do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field? :token, :string, null: true
    field? :password, :string, null: true
    field? :password_confirmation, :string, null: true
  end

  outputs do
    field? :result, :string, null: true
  end

  def call(_conn, inputs) do
    case valid_password_input(inputs) do
      {:ok, invitation} ->
        Operately.Operations.PasswordFirstTimeChanging.run(inputs, invitation)
        {:ok, %{result: "Password successfully changed"}}

      {:error, reason} ->
        {:error, :bad_request, reason}
    end
  end

  defp valid_password_input(input) do
    cond do
      input.password != input.password_confirmation ->
        {:error, "Passwords don't match"}

      true ->
        case Operately.Invitations.get_invitation_by_token(input.token) do
          nil ->
            {:error, "Invalid token"}

          invitation ->
            {:ok, invitation}
        end
    end
  end
end
