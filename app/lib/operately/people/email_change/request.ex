defmodule Operately.People.EmailChange.Request do
  alias Operately.People.EmailChange.Shared
  alias Operately.People.EmailChangeRequest
  alias Operately.Repo
  alias OperatelyEmail.Emails.EmailChangeCodeEmail
  alias OperatelyEmail.Mailers.BaseMailer

  def run(account, email) when is_binary(email) do
    Shared.with_account_lock(account, fn account ->
      with :ok <- delivery_available(),
           {:ok, changeset} <- Shared.validate_email(account, String.trim(email)),
           :ok <- check_send_limit(account) do
        issue_code(account, Ecto.Changeset.get_field(changeset, :email))
      end
    end)
  end

  def run(_, _), do: {:error, :invalid_email}

  defp delivery_available do
    if BaseMailer.email_delivery_configured?(), do: :ok, else: {:error, :delivery_unavailable}
  end

  defp check_send_limit(account) do
    if Shared.retry_after(account, Shared.now()) > 0, do: {:error, :rate_limited}, else: :ok
  end

  defp issue_code(account, email) do
    code = generate_code()
    now = Shared.now()
    Repo.update_all(Shared.pending_query(account), set: [invalidated_at: now, updated_at: DateTime.to_naive(now)])

    request =
      Repo.insert!(%EmailChangeRequest{
        account_id: account.id,
        original_email: account.email,
        email: email,
        code_hash: :crypto.hash(:sha256, code),
        expires_at: DateTime.add(now, 300),
        sent_at: now
      })

    case EmailChangeCodeEmail.send(email, code) do
      {:ok, _} -> {:ok, request}
      {:error, _} -> Repo.rollback(:delivery_failed)
    end
  end

  defp generate_code do
    # Rejection sampling keeps the alphanumeric characters uniformly distributed.
    Stream.repeatedly(fn -> :crypto.strong_rand_bytes(1) |> :binary.first() end)
    |> Stream.filter(&(&1 < 252))
    |> Stream.take(6)
    |> Enum.map_join(&String.at("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", rem(&1, 36)))
  end
end
