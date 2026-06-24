defmodule Operately.Mcp.Operations.Session do
  import Ecto.Query, warn: false

  alias Operately.Mcp.{AccessToken, Grant, Session, Token}
  alias Operately.Repo

  @touch_throttle_seconds 60

  @doc """
  Records a new MCP protocol session for a grant and access token.
  """
  def create_session(%Grant{} = grant, %AccessToken{} = access_token, params) do
    now = Token.now()

    %Session{}
    |> Session.changeset(%{
      grant_id: grant.id,
      access_token_id: access_token.id,
      protocol_version: Map.fetch!(params, :protocol_version),
      client_name: get_in(params, [:client_info, "name"]),
      client_version: get_in(params, [:client_info, "version"]),
      client_capabilities: Map.get(params, :client_capabilities, %{}),
      last_seen_at: now
    })
    |> Repo.insert()
  end

  @doc """
  Marks an MCP session as closed.
  """
  def close_session(%Session{} = session) do
    session
    |> Session.changeset(%{closed_at: Token.now(), last_seen_at: Token.now()})
    |> Repo.update()
  end

  @doc """
  Records that the client completed the MCP initialize handshake.
  """
  def mark_session_initialized(%Session{} = session) do
    now = Token.now()
    attrs = %{last_seen_at: now}
    attrs = if session.initialized_at, do: attrs, else: Map.put(attrs, :initialized_at, now)

    session
    |> Session.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Updates `last_seen_at` for an active session, throttled to once per minute.
  """
  def touch_session(%Session{} = session) do
    now = Token.now()

    threshold = DateTime.add(now, -@touch_throttle_seconds, :second)

    from(s in Session,
      where: s.id == ^session.id and s.last_seen_at < ^threshold
    )
    |> Repo.update_all(set: [last_seen_at: now, updated_at: now])

    :ok
  end
end
