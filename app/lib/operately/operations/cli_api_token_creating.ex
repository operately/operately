defmodule Operately.Operations.CliApiTokenCreating do
  import Ecto.Query, warn: false

  alias Ecto.Multi
  alias Operately.Companies.Company
  alias Operately.People
  alias Operately.People.{Account, CliAuthSession}
  alias Operately.Repo

  def run(%CliAuthSession{} = session, %Account{} = account, company_short_id, read_only) when is_boolean(read_only) do
    Multi.new()
    |> load_session_for_update(session.id)
    |> validate_session_for_token_creation(account)
    |> load_company_and_person(account, company_short_id)
    |> create_api_token(read_only)
    |> consume_session()
    |> Repo.transaction()
    |> case do
      {:ok, %{company_and_person: {company, _person}, api_token: {api_token, raw_token}}} ->
        {:ok, company, api_token, raw_token}

      {:error, :session, error, _changes} ->
        {:error, error}

      {:error, :validation, error, _changes} ->
        {:error, error}

      {:error, :company_and_person, :not_found, _changes} ->
        {:error, :not_found}

      {:error, :api_token, changeset, _changes} ->
        {:error, changeset}

      {:error, :consume_session, _changeset, _changes} ->
        {:error, :unauthorized}
    end
  end

  defp load_session_for_update(multi, session_id) do
    Multi.run(multi, :session, fn repo, _changes ->
      from(s in CliAuthSession,
        where: s.id == ^session_id,
        lock: "FOR UPDATE"
      )
      |> repo.one()
      |> case do
        nil -> {:error, :unauthorized}
        session -> {:ok, session}
      end
    end)
  end

  defp validate_session_for_token_creation(multi, %Account{} = account) do
    Multi.run(multi, :validation, fn _repo, %{session: session} ->
      cond do
        CliAuthSession.consumed?(session) ->
          {:error, :unauthorized}

        CliAuthSession.expired?(session) ->
          {:error, :unauthorized}

        session.status != :authenticated ->
          {:error, :forbidden}

        session.account_id != account.id ->
          {:error, :unauthorized}

        true ->
          {:ok, session}
      end
    end)
  end

  defp load_company_and_person(multi, %Account{} = account, company_short_id) do
    Multi.run(multi, :company_and_person, fn repo, _changes ->
      from(c in Company,
        join: p in assoc(c, :people),
        where: c.short_id == ^company_short_id and p.account_id == ^account.id and p.suspended == false and is_nil(p.suspended_at),
        select: {c, p}
      )
      |> repo.one()
      |> case do
        nil -> {:error, :not_found}
        result -> {:ok, result}
      end
    end)
  end

  defp create_api_token(multi, read_only) do
    Multi.run(multi, :api_token, fn _repo, %{company_and_person: {_company, person}} ->
      case People.create_api_token(person, %{read_only: read_only}) do
        {:ok, api_token, raw_token} -> {:ok, {api_token, raw_token}}
        {:error, changeset} -> {:error, changeset}
      end
    end)
  end

  defp consume_session(multi) do
    Multi.run(multi, :consume_session, fn repo, %{session: session} ->
      session
      |> CliAuthSession.changeset(%{status: :consumed})
      |> repo.update()
    end)
  end
end
