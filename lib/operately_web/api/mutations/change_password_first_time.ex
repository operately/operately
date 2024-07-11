defmodule OperatelyWeb.Api.Mutations.ChangePasswordFirstTime do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :token, :string
    field :password, :string
    field :password_confirmation, :string
  end

  outputs do
    field :result, :string
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
