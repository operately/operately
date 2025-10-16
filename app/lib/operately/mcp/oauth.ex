defmodule Operately.MCP.OAuth do
  @moduledoc """
  Minimal OAuth 2.1 helpers for MCP remote access.

  This module issues PKCE-protected authorization codes, exchanges them
  for access/refresh tokens, and validates bearer tokens used by the MCP
  HTTP transport.
  """

  import Ecto.Query

  alias Operately.MCP.OAuth.AuthorizationCode
  alias Operately.MCP.OAuth.Token
  alias Operately.People.Account
  alias Operately.Repo

  @code_lifetime_seconds 300
  @access_token_lifetime_seconds 3600
  @refresh_token_lifetime_seconds 30 * 24 * 3600
  @hash_algorithm :sha256

  defdelegate transaction(fun), to: Repo

  def issue_authorization_code(%{account: account, company: company}, params) do
    with %{
           "code_challenge" => code_challenge,
           "code_challenge_method" => method,
           "redirect_uri" => redirect_uri,
           "client_id" => client_id,
           "resource" => resource
         } <- params,
         true <- method in ["S256"] do
      create_authorization_code(account, company, params, code_challenge, method, redirect_uri, client_id, resource)
    else
      _ -> {:error, :invalid_authorization_request}
    end
  end

  def exchange_code(%{client_id: client_id, code: code, code_verifier: code_verifier, redirect_uri: redirect_uri, resource: resource}) do
    Repo.transaction(fn ->
      with {:ok, record} <- fetch_valid_code(code, client_id, redirect_uri, resource),
           :ok <- verify_pkce(record, code_verifier) do
        Repo.delete!(record)
        account = Repo.preload(record.account, [:people])
        company = record.company |> Repo.preload(:people)
        tokens = issue_tokens(account, company, client_id, record.scope, resource)
        Map.merge(tokens, %{account: account, company: company, person: find_person(account, company)})
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
    |> case do
      {:ok, tokens} -> {:ok, tokens}
      {:error, reason} -> {:error, reason}
    end
  end

  def exchange_refresh_token(%{client_id: client_id, refresh_token: refresh_token, resource: resource}) do
    Repo.transaction(fn ->
      with {:ok, token} <- fetch_valid_refresh_token(refresh_token, client_id, resource) do
        Repo.delete!(token)
        account = Repo.preload(token.account, [:people])
        company = Repo.preload(token.company, :people)
        tokens = issue_tokens(account, company, client_id, token.scope, resource)
        Map.merge(tokens, %{account: account, company: company, person: find_person(account, company)})
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
    |> case do
      {:ok, tokens} -> {:ok, tokens}
      {:error, reason} -> {:error, reason}
    end
  end

  def verify_access_token(token, resource) when is_binary(token) do
    hash = hash_token(token)
    now = DateTime.utc_now()

    Token
    |> where([t], t.access_token_hash == ^hash)
    |> where([t], is_nil(t.revoked_at))
    |> where([t], t.access_token_expires_at > ^now)
    |> where([t], t.resource == ^resource)
    |> Repo.one()
    |> case do
      nil ->
        {:error, :invalid_token}

      record ->
        account = Repo.preload(record.account, people: :company)
        company = Repo.preload(record.company, :people)
        {:ok, account, company, find_person(account, company)}
    end
  end

  def revoke_access_token(token) when is_binary(token) do
    from(t in Token,
      where: t.access_token_hash == ^hash_token(token)
    )
    |> Repo.update_all(set: [revoked_at: DateTime.utc_now()])

    :ok
  end

  defp fetch_valid_code(code, client_id, redirect_uri, resource) do
    hash = hash_token(code)
    now = DateTime.utc_now()

    AuthorizationCode
    |> where([c], c.code_hash == ^hash)
    |> where([c], c.client_id == ^client_id)
    |> where([c], c.redirect_uri == ^redirect_uri)
    |> where([c], c.resource == ^resource)
    |> where([c], c.expires_at > ^now)
    |> Repo.one()
    |> case do
      nil -> {:error, :invalid_grant}
      record -> {:ok, Repo.preload(record, [:account, :company])}
    end
  end

  defp fetch_valid_refresh_token(refresh_token, client_id, resource) do
    hash = hash_token(refresh_token)
    now = DateTime.utc_now()

    Token
    |> where([t], t.refresh_token_hash == ^hash)
    |> where([t], t.client_id == ^client_id)
    |> where([t], t.resource == ^resource)
    |> where([t], is_nil(t.revoked_at))
    |> where([t], t.refresh_token_expires_at > ^now)
    |> Repo.one()
    |> case do
      nil -> {:error, :invalid_grant}
      record -> {:ok, Repo.preload(record, [:account, :company])}
    end
  end

  defp issue_tokens(account, company, client_id, scope, resource) do
    access = generate_token()
    refresh = generate_token()

    attrs = %{
      access_token_hash: hash_token(access),
      refresh_token_hash: hash_token(refresh),
      access_token_expires_at: DateTime.utc_now() |> DateTime.add(@access_token_lifetime_seconds, :second),
      refresh_token_expires_at: DateTime.utc_now() |> DateTime.add(@refresh_token_lifetime_seconds, :second),
      scope: scope,
      client_id: client_id,
      resource: resource,
      account_id: account.id,
      company_id: company.id
    }

    %Token{}
    |> Token.changeset(attrs)
    |> Repo.insert!()

    %{
      access_token: access,
      refresh_token: refresh,
      token_type: "Bearer",
      expires_in: @access_token_lifetime_seconds,
      scope: scope,
      resource: resource
    }
  end

  defp verify_pkce(%AuthorizationCode{code_challenge_method: "S256", code_challenge: challenge}, code_verifier) do
    calculated =
      :crypto.hash(:sha256, code_verifier)
      |> Base.url_encode64(padding: false)

    if calculated == challenge do
      :ok
    else
      {:error, :invalid_grant}
    end
  end

  defp generate_token do
    :crypto.strong_rand_bytes(32)
    |> Base.url_encode64(padding: false)
  end

  defp hash_token(token) do
    :crypto.hash(@hash_algorithm, token)
  end

  defp find_person(%Account{people: people}, company) when is_list(people) do
    direct_match =
      Enum.find(people, &(&1.company_id == company.id))

    case direct_match do
      nil ->
        account_ids = Enum.map(people, & &1.account_id)
        Enum.find(company.people || [], fn candidate -> candidate.account_id in account_ids end) ||
          List.first(people)

      person ->
        person
    end
  end

  defp find_person(_, _), do: nil

  defp create_authorization_code(account, company, params, code_challenge, method, redirect_uri, client_id, resource) do
    code = generate_token()

    attrs = %{
      code_hash: hash_token(code),
      code_challenge: code_challenge,
      code_challenge_method: method,
      redirect_uri: redirect_uri,
      scope: params["scope"],
      client_id: client_id,
      resource: resource,
      expires_at: DateTime.utc_now() |> DateTime.add(@code_lifetime_seconds, :second),
      account_id: account.id,
      company_id: company.id
    }

    %AuthorizationCode{}
    |> AuthorizationCode.changeset(attrs)
    |> Repo.insert()
    |> case do
      {:ok, _} -> {:ok, code}
      {:error, changeset} -> {:error, {:invalid_authorization_request, changeset}}
    end
  end
end
