defmodule OperatelyWeb.Api.Mutations.RequestPasswordReset do
  use TurboConnect.Mutation

  alias Operately.People.AccountToken
  require Logger

  inputs do
    field :email, :string
  end

  def call(_conn, inputs) do
    with(
      {:ok, account} <- find_account(inputs.email),
      {:ok, token} <- create_token(account),
      {:ok, _} <- send_email(account, token)
    ) do
      {:ok, %{}}
    else
      {:error, :account_not_found} ->
        Logger.info("Password reset requested for non-existent account with email: #{inputs.email}")
        # don't expose that an account with this email doesn't exist
        {:ok, %{}}
        
      {:error, :failed_to_create_token} ->
        Logger.error("Failed to create token for password reset for account with email: #{inputs.email}")
        {:error, :internal_server_error}

      {:error, _} ->
        Logger.error("Failed to send email for password reset for account with email: #{inputs.email}")
        {:error, :internal_server_error}
    end
  end

  defp find_account(email) do
    case Operately.People.get_account_by_email(email) do
      nil -> {:error, :account_not_found}
      account -> {:ok, account}
    end
  end

  defp create_token(account) do
    {hashed, token} = AccountToken.build_email_token(account, "reset_password")

    case Operately.Repo.insert(token) do
      {:ok, _} -> {:ok, hashed}
      {:error, _} -> {:error, :failed_to_create_token}
    end
  end

  defp send_email(account, token) do
    OperatelyEmail.Emails.ResetPasswordEmail.send(account, token)
  end
end
