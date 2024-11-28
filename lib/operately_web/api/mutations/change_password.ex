defmodule OperatelyWeb.Api.Mutations.ChangePassword do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :current_password, :string
    field :new_password, :string
    field :new_password_confirmation, :string
  end

  def call(conn, inputs) do
    with(
      account <- conn.assigns[:current_account],
      :ok <- verify_password_confirmation(inputs),
      :ok <- verify_current_password(account, inputs.current_password),
      :ok <- change_password(conn, inputs)
    ) do
      {:ok, %{}}
    else
      _ -> {:error, :forbidden}
    end
  end

  defp verify_password_confirmation(inputs) do
    case inputs.new_password == inputs.new_password_confirmation do
      true -> :ok
      false -> {:error, :forbidden}
    end
  end

  defp verify_current_password(account, current_password) do
    case Operately.People.Account.valid_password?(account, current_password) do
      true -> :ok
      false -> {:error, :forbidden}
    end
  end

  defp change_password(conn, inputs) do
    account = conn.assigns[:current_account]

    changeset = Operately.People.Account.password_changeset(account, %{
      password: inputs.new_password
    })

    case Operately.Repo.update(changeset) do
      {:ok, _} -> :ok
      {:error, _} -> {:error, :forbidden}
    end
  end
end
