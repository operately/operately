defmodule Operately.People.EmailChange.DeliverCode do
  alias Operately.People.EmailChange.Shared
  alias Operately.People.EmailChangeRequest
  alias Operately.Repo
  alias OperatelyEmail.Emails.{CurrentEmailVerificationEmail, EmailChangeCodeEmail}
  alias OperatelyEmail.Mailers.BaseMailer

  # Called only while holding the account lock. A failed delivery rolls back the replacement.
  def run(account, email, stage, verified_at \\ nil) do
    if BaseMailer.email_delivery_configured?() do
      code = generate_code()
      now = Shared.now()

      Repo.update_all(Shared.pending_query(account), set: [invalidated_at: now, updated_at: DateTime.to_naive(now)])

      request =
        Repo.insert!(%EmailChangeRequest{
          account_id: account.id,
          original_email: account.email,
          email: email,
          stage: stage,
          current_email_verified_at: verified_at,
          code_hash: :crypto.hash(:sha256, code),
          expires_at: code_expires_at(now, verified_at),
          sent_at: now
        })

      delivery =
        case stage do
          :current_email -> CurrentEmailVerificationEmail.send(account.email, email, code)
          :new_email -> EmailChangeCodeEmail.send(email, code)
        end

      case delivery do
        {:ok, _} -> {:ok, request}
        {:error, _} -> Repo.rollback(:delivery_failed)
      end
    else
      {:error, :delivery_unavailable}
    end
  end

  defp code_expires_at(now, nil), do: DateTime.add(now, 300)

  defp code_expires_at(now, verified_at) do
    code_expiry = DateTime.add(now, 300)
    authorization_expiry = Shared.authorization_expires_at(%{current_email_verified_at: verified_at})
    if DateTime.compare(code_expiry, authorization_expiry) == :gt, do: authorization_expiry, else: code_expiry
  end

  defp generate_code do
    # Rejection sampling keeps the alphanumeric characters uniformly distributed.
    Stream.repeatedly(fn -> :crypto.strong_rand_bytes(1) |> :binary.first() end)
    |> Stream.filter(&(&1 < 252))
    |> Stream.take(6)
    |> Enum.map_join(&String.at("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", rem(&1, 36)))
  end
end
