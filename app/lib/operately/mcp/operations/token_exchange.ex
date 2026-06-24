defmodule Operately.Mcp.Operations.TokenExchange do
  import Ecto.Query, warn: false

  alias Operately.Mcp.Operations.Grant, as: GrantOps
  alias Operately.Mcp.{AccessToken, AuthorizationCode, Grant, RefreshToken, Resources, Token}
  alias Operately.Repo

  @access_token_ttl_seconds 15 * 60
  @refresh_token_ttl_seconds 30 * 24 * 60 * 60
  @touch_throttle_seconds 60
  @access_token_prefix "opma_"
  @refresh_token_prefix "opmr_"

  @doc """
  Exchanges an authorization code and PKCE verifier for access and refresh tokens.
  """
  def exchange_authorization_code(attrs) when is_map(attrs) do
    with {:ok, client_id} <- fetch_required(attrs, "client_id"),
         {:ok, redirect_uri} <- fetch_required(attrs, "redirect_uri"),
         {:ok, raw_code} <- fetch_required(attrs, "code"),
         {:ok, code_verifier} <- fetch_required(attrs, "code_verifier"),
         {:ok, resource} <- fetch_required(attrs, "resource"),
         true <- Resources.resource_valid?(resource) or {:error, :invalid_target_resource},
         {:ok, %AuthorizationCode{} = code} <- find_authorization_code(raw_code),
         code <- Repo.preload(code, grant: [:account, :company]),
         :ok <- validate_code_exchange(code, client_id, redirect_uri, resource),
         :ok <- verify_pkce(code_verifier, code.code_challenge),
         {:ok, tokens} <- consume_code_and_issue_tokens(code) do
      {:ok, tokens}
    end
  end

  @doc """
  Rotates a refresh token and issues new access and refresh tokens.
  """
  def refresh_access_token(attrs) when is_map(attrs) do
    with {:ok, client_id} <- fetch_required(attrs, "client_id"),
         {:ok, raw_refresh_token} <- fetch_required(attrs, "refresh_token"),
         {:ok, resource} <- fetch_required(attrs, "resource"),
         true <- Resources.resource_valid?(resource) or {:error, :invalid_target_resource},
         {:ok, %RefreshToken{} = refresh_token} <- find_refresh_token(raw_refresh_token),
         refresh_token <- Repo.preload(refresh_token, grant: [:account, :company]),
         :ok <- validate_refresh_token(refresh_token, client_id, resource),
         {:ok, tokens} <- rotate_refresh_token(refresh_token) do
      {:ok, tokens}
    end
  end

  @doc """
  Validates a bearer access token for the given resource and returns its grant context.
  """
  def authenticate_access_token(raw_token, resource) when is_binary(raw_token) and is_binary(resource) do
    with true <- Resources.resource_valid?(resource) or {:error, :invalid_target_resource},
         {:ok, %AccessToken{} = access_token} <- find_access_token(raw_token),
         access_token <- Repo.preload(access_token, grant: [:account, :company]),
         :ok <- validate_access_token(access_token, resource) do
      touch_access_token(access_token)

      {:ok,
       %{
         access_token: access_token,
         grant: access_token.grant,
         account: access_token.grant.account
       }}
    end
  end

  defp verify_pkce(code_verifier, code_challenge) when is_binary(code_verifier) and is_binary(code_challenge) do
    encoded =
      :crypto.hash(:sha256, code_verifier)
      |> Base.url_encode64(padding: false)

    if encoded == code_challenge, do: :ok, else: {:error, :invalid_grant}
  end

  defp verify_pkce(_, _), do: {:error, :invalid_grant}

  defp consume_code_and_issue_tokens(%AuthorizationCode{} = code) do
    Repo.transaction(fn ->
      code =
        Repo.one!(
          from(c in AuthorizationCode,
            where: c.id == ^code.id,
            preload: [grant: [:account, :company]]
          )
        )

      if code.consumed_at || Token.expired?(code.expires_at) do
        Repo.rollback(:invalid_grant)
      end

      code
      |> AuthorizationCode.changeset(%{consumed_at: Token.now()})
      |> Repo.update!()

      issue_tokens!(code.grant, code.scopes, code.resource, nil)
    end)
    |> case do
      {:ok, tokens} -> {:ok, tokens}
      {:error, reason} -> {:error, reason}
      {:error, _step, reason, _changes} -> {:error, reason}
    end
  end

  defp rotate_refresh_token(%RefreshToken{} = refresh_token) do
    Repo.transaction(fn ->
      refresh_token =
        Repo.one!(
          from(t in RefreshToken,
            where: t.id == ^refresh_token.id,
            preload: [grant: [:account, :company]]
          )
        )

      cond do
        refresh_token.revoked_at ->
          Repo.rollback(:invalid_grant)

        refresh_token.used_at ->
          GrantOps.revoke_grant_lineage(refresh_token.grant, Token.now(), true)
          Repo.rollback(:invalid_grant)

        Token.expired?(refresh_token.expires_at) ->
          GrantOps.revoke_grant_lineage(refresh_token.grant, Token.now(), true)
          Repo.rollback(:invalid_grant)

        true ->
          now = Token.now()

          refresh_token
          |> RefreshToken.changeset(%{used_at: now})
          |> Repo.update!()

          {access_token, raw_access_token} = build_access_token(refresh_token.grant, refresh_token.scopes, refresh_token.resource)

          access_token = Repo.insert!(access_token)

          {new_refresh_token, raw_refresh_token} =
            build_refresh_token(refresh_token.grant, refresh_token.scopes, refresh_token.resource, refresh_token.id)

          new_refresh_token = Repo.insert!(new_refresh_token)

          refresh_token
          |> RefreshToken.changeset(%{replaced_by_token_id: new_refresh_token.id})
          |> Repo.update!()

          %{
            access_token: raw_access_token,
            refresh_token: raw_refresh_token,
            token_type: "Bearer",
            expires_in: @access_token_ttl_seconds,
            scope: Resources.scopes_to_string(refresh_token.scopes),
            access_token_record: access_token,
            refresh_token_record: new_refresh_token,
            grant: refresh_token.grant
          }
      end
    end)
    |> case do
      {:ok, tokens} -> {:ok, tokens}
      {:error, reason} -> {:error, reason}
      {:error, _step, reason, _changes} -> {:error, reason}
    end
  end

  defp issue_tokens!(%Grant{} = grant, scopes, resource, previous_refresh_token_id) do
    {access_token, raw_access_token} = build_access_token(grant, scopes, resource)
    access_token = Repo.insert!(access_token)

    {refresh_token, raw_refresh_token} = build_refresh_token(grant, scopes, resource, previous_refresh_token_id)
    refresh_token = Repo.insert!(refresh_token)

    %{
      access_token: raw_access_token,
      refresh_token: raw_refresh_token,
      token_type: "Bearer",
      expires_in: @access_token_ttl_seconds,
      scope: Resources.scopes_to_string(scopes),
      access_token_record: access_token,
      refresh_token_record: refresh_token,
      grant: grant
    }
  end

  defp build_access_token(%Grant{} = grant, scopes, resource) do
    raw_token = Token.generate(@access_token_prefix)

    token =
      %AccessToken{}
      |> AccessToken.changeset(%{
        grant_id: grant.id,
        token_hash: Token.hash(raw_token),
        resource: resource,
        scopes: scopes,
        expires_at: Token.expires_in(@access_token_ttl_seconds, :second)
      })

    {token, raw_token}
  end

  defp build_refresh_token(%Grant{} = grant, scopes, resource, previous_refresh_token_id) do
    raw_token = Token.generate(@refresh_token_prefix)

    token =
      %RefreshToken{}
      |> RefreshToken.changeset(%{
        grant_id: grant.id,
        token_hash: Token.hash(raw_token),
        resource: resource,
        scopes: scopes,
        expires_at: Token.expires_in(@refresh_token_ttl_seconds, :second),
        previous_token_id: previous_refresh_token_id
      })

    {token, raw_token}
  end

  defp validate_code_exchange(code, client_id, redirect_uri, resource) do
    cond do
      code.consumed_at -> {:error, :invalid_grant}
      Token.expired?(code.expires_at) -> {:error, :invalid_grant}
      code.grant.client_id != client_id -> {:error, :invalid_client}
      code.redirect_uri != redirect_uri -> {:error, :invalid_grant}
      Resources.normalize_resource_uri(code.resource) != Resources.normalize_resource_uri(resource) -> {:error, :invalid_target_resource}
      code.grant.revoked_at != nil -> {:error, :invalid_grant}
      true -> :ok
    end
  end

  defp validate_refresh_token(refresh_token, client_id, resource) do
    cond do
      refresh_token.grant.client_id != client_id -> {:error, :invalid_client}
      refresh_token.grant.revoked_at != nil -> {:error, :invalid_grant}
      Resources.normalize_resource_uri(refresh_token.resource) != Resources.normalize_resource_uri(resource) -> {:error, :invalid_target_resource}
      true -> :ok
    end
  end

  defp validate_access_token(access_token, resource) do
    cond do
      access_token.revoked_at -> {:error, :unauthorized}
      Token.expired?(access_token.expires_at) -> {:error, :unauthorized}
      access_token.grant.revoked_at != nil -> {:error, :unauthorized}
      Resources.normalize_resource_uri(access_token.resource) != Resources.normalize_resource_uri(resource) -> {:error, :unauthorized}
      true -> :ok
    end
  end

  defp find_authorization_code(raw_code) do
    hash = Token.hash(String.trim(raw_code))

    Repo.one(from c in AuthorizationCode, where: c.code_hash == ^hash)
    |> case do
      nil -> {:error, :invalid_grant}
      code -> {:ok, code}
    end
  end

  defp find_refresh_token(raw_token) do
    hash = Token.hash(String.trim(raw_token))

    Repo.one(from t in RefreshToken, where: t.token_hash == ^hash)
    |> case do
      nil -> {:error, :invalid_grant}
      token -> {:ok, token}
    end
  end

  defp find_access_token(raw_token) do
    hash = Token.hash(String.trim(raw_token))

    Repo.one(from t in AccessToken, where: t.token_hash == ^hash)
    |> case do
      nil -> {:error, :unauthorized}
      token -> {:ok, token}
    end
  end

  defp touch_access_token(%AccessToken{} = access_token) do
    now = Token.now()
    threshold = DateTime.add(now, -@touch_throttle_seconds, :second)

    from(t in AccessToken,
      where: t.id == ^access_token.id and (is_nil(t.last_used_at) or t.last_used_at < ^threshold)
    )
    |> Repo.update_all(set: [last_used_at: now, updated_at: now])

    :ok
  end

  defp fetch_required(map, key) when is_map(map) do
    case Map.get(map, key) do
      value when is_binary(value) and value != "" -> {:ok, value}
      _ -> {:error, :invalid_request}
    end
  end
end
