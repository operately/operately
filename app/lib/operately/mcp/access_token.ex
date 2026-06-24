defmodule Operately.Mcp.AccessToken do
  use Operately.Schema

  schema "mcp_access_tokens" do
    field :token_hash, :binary
    field :resource, :string
    field :scopes, {:array, :string}, default: []
    field :expires_at, :utc_datetime
    field :revoked_at, :utc_datetime
    field :last_used_at, :utc_datetime

    belongs_to :grant, Operately.Mcp.Grant

    timestamps()
  end

  def changeset(token, attrs) do
    token
    |> cast(attrs, [:grant_id, :token_hash, :resource, :scopes, :expires_at, :revoked_at, :last_used_at])
    |> validate_required([:grant_id, :token_hash, :resource, :scopes, :expires_at])
    |> unique_constraint(:token_hash)
    |> foreign_key_constraint(:grant_id)
  end
end
