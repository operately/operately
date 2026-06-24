defmodule Operately.Mcp.Session do
  use Operately.Schema

  schema "mcp_sessions" do
    field :protocol_version, :string
    field :client_name, :string
    field :client_version, :string
    field :client_capabilities, :map, default: %{}
    field :initialized_at, :utc_datetime
    field :last_seen_at, :utc_datetime
    field :closed_at, :utc_datetime

    belongs_to :grant, Operately.Mcp.Grant
    belongs_to :access_token, Operately.Mcp.AccessToken

    timestamps()
  end

  def changeset(session, attrs) do
    session
    |> cast(attrs, [:grant_id, :access_token_id, :protocol_version, :client_name, :client_version, :client_capabilities, :initialized_at, :last_seen_at, :closed_at])
    |> validate_required([:grant_id, :access_token_id, :protocol_version, :client_capabilities, :last_seen_at])
    |> foreign_key_constraint(:grant_id)
    |> foreign_key_constraint(:access_token_id)
  end
end
