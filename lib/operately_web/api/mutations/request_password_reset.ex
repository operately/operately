defmodule OperatelyWeb.Api.Mutations.RequestPasswordReset do
  use TurboConnect.Mutation

  alias Operately.People.AccountToken

  inputs do
    field :email, :string
  end

  def call(_conn, inputs) do
    with(
      {:ok, account} <- find_account(inputs.email),
      {:ok, token} <- create_token(account),
      {:ok, _} <- OperatelyEmail.Emails.ResetPassword.send(account, token)
    ) do
      {:ok, %{}}
    else
      e -> e
    end
  end

  defp find_account(email) do
    case Operately.People.get_account_by_email(email) do
      {:ok, account} -> {:ok, account}
      _ -> {:error, :not_found}
    end
  end

  defp create_token(account) do
    {hashed, token} = AccountToken.build_email_token(account, "reset_password")

    case Operately.Repo.insert(token) do
      {:ok, _} -> {:ok, hashed}
      {:error, _} -> {:error, :internal_server_error}
    end
  end
end
