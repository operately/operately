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
             :ok <- Shared.check_stage(request, :new_email),
             :ok <- Shared.check_authorization(request),
             :ok <- Shared.check_validity(request),
             :ok <- Shared.verify_code(request, code),
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
