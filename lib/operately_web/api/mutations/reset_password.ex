defmodule OperatelyWeb.Api.Mutations.ResetPassword do
  use TurboConnect.Mutation

  inputs do
    field :email, :string
    field :password, :string
    field :password_confirmation, :string
    field :reset_password_token, :string
  end

  def call(_conn, inputs) do
    with(
      {:ok, account} <- find_account(inputs.reset_password_token),
      :ok <- verify_account_email(account, inputs.email),
      :ok <- verify_presence_of_fields(inputs),
      :ok <- verify_password_confirmation(inputs),
      :ok <- change_password(account, inputs.password)
    ) do
      {:ok, %{}}
    else
      _ -> {:error, :forbidden}
    end
  end

  defp find_account(token) do
    case Operately.People.get_account_by_reset_password_token(token) do
      nil -> {:error, :account_not_found}
      account -> {:ok, account}
    end
  end

  defp verify_account_email(account, email) do
    case account.email == email do
      true -> :ok
      false -> {:error, :forbidden}
    end
  end

  defp verify_password_confirmation(inputs) do
    case inputs.password == inputs.password_confirmation do
      true -> :ok
      false -> {:error, :forbidden}
    end
  end

  defp verify_presence_of_fields(inputs) do
    with(
      true <- verify_non_empty_string?(inputs[:password]),
      true <- verify_non_empty_string?(inputs[:password_confirmation])
    ) do
      :ok
    else
      _ -> {:error, :forbidden}
    end
  end

  defp change_password(account, password) do
    changeset = Operately.People.Account.password_changeset(account, %{password: password})

    case Operately.Repo.update(changeset) do
      {:ok, _} -> :ok
      {:error, _} -> {:error, :forbidden}
    end
  end

  defp verify_non_empty_string?(value) when is_binary(value) and value != "", do: true
  defp verify_non_empty_string?(_), do: false
end
