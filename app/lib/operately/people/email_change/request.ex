defmodule Operately.People.EmailChange.Request do
  alias Operately.People.EmailChange.{DeliverCode, Shared}

  def run(account, email) when is_binary(email) do
    Shared.with_account_lock(account, fn account ->
      with {:ok, changeset} <- Shared.validate_email(account, String.trim(email)),
           :ok <- Shared.check_send_limit(account) do
        DeliverCode.run(account, Ecto.Changeset.get_field(changeset, :email), :current_email)
      end
    end)
  end

  def run(_, _), do: {:error, :invalid_email}
end
