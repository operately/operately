defmodule Operately.People.EmailChange.Shared do
  @moduledoc false

  import Ecto.Query

  alias Operately.People.{Account, EmailChangeRequest}
  alias Operately.Repo

  @max_sends_per_hour 10

  def with_account_lock(account, action) do
    Repo.transaction(fn ->
      account = Repo.one!(from a in Account, where: a.id == ^account.id, lock: "FOR UPDATE")
      if account.deleted_at, do: Repo.rollback(:request_invalid)
      action.(account)
    end)
    |> case do
      {:ok, result} -> result
      {:error, reason} -> {:error, reason}
    end
  end

  def validate_email(account, email) do
    changeset = Account.email_changeset(account, %{email: email})

    cond do
      String.downcase(account.email) == String.downcase(email) -> {:error, :email_unchanged}
      changeset.valid? -> {:ok, changeset}
      Keyword.has_key?(changeset.errors, :email) -> {:error, email_error(changeset)}
      true -> {:error, :invalid_email}
    end
  end

  def email_error(changeset) do
    if Enum.any?(changeset.errors, fn {_, {_, opts}} -> opts[:validation] == :unsafe_unique or opts[:constraint] == :unique end),
      do: :email_taken,
      else: :invalid_email
  end

  # Return the longer wait required by the 60-second cooldown and the hourly send limit.
  def retry_after(account, now) do
    sends = Repo.all(from r in EmailChangeRequest, where: r.account_id == ^account.id and r.sent_at > ^DateTime.add(now, -3600), order_by: [desc: r.sent_at], select: r.sent_at)

    cooldown =
      case sends do
        [] -> 0
        [latest | _] -> 60 - DateTime.diff(now, latest)
      end

    hourly = if length(sends) >= @max_sends_per_hour, do: 3600 - DateTime.diff(now, Enum.at(sends, @max_sends_per_hour - 1)), else: 0
    Enum.max([0, cooldown, hourly])
  end

  def pending_query(account) do
    from r in EmailChangeRequest, where: r.account_id == ^account.id and is_nil(r.invalidated_at)
  end

  def find_pending(account, id) do
    with {:ok, id} <- Ecto.UUID.cast(id),
         %EmailChangeRequest{} = request <- Repo.one(from r in pending_query(account), where: r.id == ^id),
         true <- String.downcase(request.original_email) == String.downcase(account.email) do
      {:ok, request}
    else
      _ -> {:error, :request_invalid}
    end
  end

  def now, do: DateTime.utc_now() |> DateTime.truncate(:second)
end
