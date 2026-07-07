defmodule Operately.Mcp.Operations.Grant do
  import Ecto.Query, warn: false

  alias Operately.Mcp.{AccessToken, AuthorizationCode, Grant, RefreshToken, Session, Token}
  alias Operately.Repo

  @authorization_code_ttl_seconds 5 * 60
  @authorization_code_prefix "opmc_"

  @doc """
  Lists active MCP grants for an account and company with last-used timestamps.
  """
  def list_grants_for_company(account, company) do
    grants =
      from(g in Grant,
        where: g.account_id == ^account.id and g.company_id == ^company.id and is_nil(g.revoked_at),
        order_by: [desc: g.inserted_at]
      )
      |> Repo.all()

    grant_ids = Enum.map(grants, & &1.id)

    last_used_by_grant_id =
      if grant_ids == [] do
        %{}
      else
        from(t in AccessToken,
          where: t.grant_id in ^grant_ids,
          group_by: t.grant_id,
          select: {t.grant_id, max(t.last_used_at)}
        )
        |> Repo.all()
        |> Map.new()
      end

    Enum.map(grants, fn grant ->
      %{grant | last_used_at: Map.get(last_used_by_grant_id, grant.id)}
    end)
  end

  @doc """
  Revokes a grant owned by the account in the given company and invalidates its token lineage.
  """
  def revoke_grant_for_company(account, company, grant_id) when is_binary(grant_id) do
    with {:ok, grant_id} <- Ecto.UUID.cast(grant_id),
         %Grant{} = grant <- Repo.get(Grant, grant_id),
         true <- grant.account_id == account.id,
         true <- grant.company_id == company.id,
         true <- is_nil(grant.revoked_at) do
      revoke_grant_lineage(grant, Token.now(), true)
      :ok
    else
      :error -> {:error, :not_found}
      nil -> {:error, :not_found}
      false -> {:error, :not_found}
    end
  end

  def revoke_grant_for_company(_account, _company, _grant_id), do: {:error, :not_found}

  @doc """
  Creates or updates a grant for the account, company, and authorized client.
  """
  def upsert_grant(account, company, auth_request) do
    now = Token.now()

    Repo.get_by(Grant, account_id: account.id, company_id: company.id, client_id: auth_request.client_id)
    |> case do
      nil ->
        %Grant{}
        |> Grant.changeset(%{
          account_id: account.id,
          company_id: company.id,
          client_id: auth_request.client_id,
          client_name: auth_request.client.client_name,
          client_uri: auth_request.client.client_uri,
          redirect_uri: auth_request.redirect_uri,
          resource: auth_request.resource,
          scopes: auth_request.scopes,
          revoked_at: nil
        })
        |> Repo.insert()

      %Grant{} = grant ->
        Repo.transaction(fn ->
          revoke_grant_lineage(grant, now, false)

          grant
          |> Grant.changeset(%{
            client_name: auth_request.client.client_name,
            client_uri: auth_request.client.client_uri,
            redirect_uri: auth_request.redirect_uri,
            resource: auth_request.resource,
            scopes: auth_request.scopes,
            revoked_at: nil
          })
          |> Repo.update!()
        end)
        |> case do
          {:ok, grant} -> {:ok, grant}
          {:error, _step, reason, _changes} -> {:error, reason}
        end
    end
  end

  @doc """
  Issues a short-lived authorization code for the token endpoint.
  """
  def issue_authorization_code(%Grant{} = grant, auth_request) do
    raw_code = Token.generate(@authorization_code_prefix)

    %AuthorizationCode{}
    |> AuthorizationCode.changeset(%{
      grant_id: grant.id,
      code_hash: Token.hash(raw_code),
      redirect_uri: auth_request.redirect_uri,
      resource: auth_request.resource,
      scopes: auth_request.scopes,
      code_challenge: auth_request.code_challenge,
      code_challenge_method: auth_request.code_challenge_method,
      expires_at: Token.expires_in(@authorization_code_ttl_seconds, :second)
    })
    |> Repo.insert()
    |> case do
      {:ok, code} -> {:ok, code, raw_code}
      {:error, changeset} -> {:error, changeset}
    end
  end

  @doc """
  Revokes a grant and all active tokens and sessions before a client reconnects.
  """
  def revoke_grant_for_reconnect(%Grant{} = grant) do
    now = Token.now()
    revoke_grant_lineage(grant, now, true)
    :ok
  end

  @doc """
  Revokes active tokens and sessions for a grant, optionally marking the grant revoked.
  """
  def revoke_grant_lineage(%Grant{} = grant, now, revoke_grant?) do
    if revoke_grant? do
      grant
      |> Grant.changeset(%{revoked_at: now})
      |> Repo.update!()
    end

    from(t in AccessToken, where: t.grant_id == ^grant.id and is_nil(t.revoked_at))
    |> Repo.update_all(set: [revoked_at: now, updated_at: now])

    from(t in RefreshToken, where: t.grant_id == ^grant.id and is_nil(t.revoked_at))
    |> Repo.update_all(set: [revoked_at: now, updated_at: now])

    from(s in Session, where: s.grant_id == ^grant.id and is_nil(s.closed_at))
    |> Repo.update_all(set: [closed_at: now, last_seen_at: now, updated_at: now])
  end
end
