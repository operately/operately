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
  def retry_after(account, now, opts \\ []) do
    sends = Repo.all(from r in EmailChangeRequest, where: r.account_id == ^account.id and r.sent_at > ^DateTime.add(now, -3600), order_by: [desc: r.sent_at], select: r.sent_at)

    cooldown =
      case sends do
        [] -> 0
        [latest | _] -> 60 - DateTime.diff(now, latest)
      end

    hourly = if length(sends) >= @max_sends_per_hour, do: 3600 - DateTime.diff(now, Enum.at(sends, @max_sends_per_hour - 1)), else: 0
    if Keyword.get(opts, :skip_cooldown, false), do: max(0, hourly), else: Enum.max([0, cooldown, hourly])
  end

  def pending_query(account) do
    from r in EmailChangeRequest, where: r.account_id == ^account.id and is_nil(r.invalidated_at)
  end

  def find_pending(account, id) do
    with {:ok, id} <- Ecto.UUID.cast(id),
         %EmailChangeRequest{} = request <- Repo.one(from r in pending_query(account), where: r.id == ^id),
         true <- request.stage in [:current_email, :new_email],
         true <- String.downcase(request.original_email) == String.downcase(account.email) do
      {:ok, request}
    else
      _ -> {:error, :request_invalid}
    end
  end

  def check_stage(%{stage: stage}, stage), do: :ok
  def check_stage(_, _), do: {:error, :request_invalid}

  def authorization_expires_at(%{current_email_verified_at: nil}), do: nil
  def authorization_expires_at(request), do: DateTime.add(request.current_email_verified_at, 600)

  def check_authorization(%{stage: :current_email}), do: :ok
  def check_authorization(%{stage: :new_email, current_email_verified_at: nil}), do: {:error, :request_invalid}

  def check_authorization(%{stage: :new_email} = request) do
    if DateTime.compare(authorization_expires_at(request), now()) == :gt, do: :ok, else: {:error, :authorization_expired}
  end

  def check_send_limit(account, opts \\ []) do
    if retry_after(account, now(), opts) > 0, do: {:error, :rate_limited}, else: :ok
  end

  def check_validity(request) do
    cond do
      request.attempts >= 5 -> {:error, :too_many_attempts}
      DateTime.compare(request.expires_at, now()) != :gt -> {:error, :code_expired}
      true -> :ok
    end
  end

  def verify_code(request, code) do
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

  def now, do: DateTime.utc_now() |> DateTime.truncate(:second)
end
