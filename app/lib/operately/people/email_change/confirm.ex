defmodule Operately.People.EmailChange.Confirm do
  import Ecto.Query

  alias Ecto.Multi
  alias Operately.People.EmailChange.Shared
  alias Operately.People.{Account, AccountToken, EmailChangedEmailWorker, Person}
  alias Operately.Repo
  alias Operately.Search.IndexUpdates

  def run(account, request_id, code) do
    result =
      Shared.with_account_lock(account, fn account ->
        with {:ok, request} <- Shared.find_pending(account, request_id),
             :ok <- check_validity(request),
             :ok <- verify_code(request, code),
             {:ok, changeset} <- Shared.validate_email(account, request.email) do
          complete_change(account, changeset)
        end
      end)

    if result == :ok do
      Repo.all(from p in Person, where: p.account_id == ^account.id, select: p.id)
      |> Enum.each(&OperatelyWeb.ApiSocket.broadcast!("api:profile_updated:#{&1}"))
    end

    result
  end

  defp check_validity(request) do
    cond do
      request.attempts >= 5 -> {:error, :too_many_attempts}
      DateTime.compare(request.expires_at, Shared.now()) != :gt -> {:error, :code_expired}
      true -> :ok
    end
  end

  defp verify_code(request, code) do
    normalized = if is_binary(code), do: code |> String.trim() |> String.upcase() |> String.replace(~r/[\s-]/u, ""), else: ""
    valid = Regex.match?(~r/^[A-Z0-9]{6}$/, normalized) and Plug.Crypto.secure_compare(request.code_hash, :crypto.hash(:sha256, normalized))

    if valid do
      :ok
    else
      attempts = request.attempts + 1
      request |> Ecto.Changeset.change(attempts: attempts) |> Repo.update!()
      # Return the error normally so this attempt is committed, not rolled back.
      {:error, if(attempts >= 5, do: :too_many_attempts, else: :invalid_code)}
    end
  end

  defp complete_change(account, changeset) do
    people = from p in Person, where: p.account_id == ^account.id
    person_ids = Repo.all(from p in people, select: p.id)
    email = Ecto.Changeset.get_field(changeset, :email)
    recovery_tokens = from t in AccountToken, where: t.account_id == ^account.id and t.context != "session"

    Multi.new()
    |> Multi.update(:account, Account.confirm_changeset(changeset))
    |> Multi.update_all(:people, people, set: [email: email, updated_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)])
    |> Multi.update_all(:requests, Shared.pending_query(account), set: [invalidated_at: Shared.now(), updated_at: DateTime.to_naive(Shared.now())])
    |> Multi.delete_all(:recovery_tokens, recovery_tokens)
    |> IndexUpdates.enqueue(:search_people, "person", person_ids)
    |> Oban.insert(:email_changed, EmailChangedEmailWorker.new(%{old_email: account.email, new_email: email}))
    |> Repo.transaction()
    |> case do
      {:ok, _} ->
        :ok

      {:error, :account, changeset, _} ->
        Repo.rollback(Shared.email_error(changeset))

      {:error, _step, reason, _} ->
        Repo.rollback(reason)
    end
  end
end
