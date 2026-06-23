defmodule Operately.Mcp.RefreshToken do
  use Operately.Schema

  schema "mcp_refresh_tokens" do
    field :token_hash, :binary
    field :resource, :string
    field :scopes, {:array, :string}, default: []
    field :expires_at, :utc_datetime
    field :revoked_at, :utc_datetime
    field :used_at, :utc_datetime

    belongs_to :grant, Operately.Mcp.Grant
    belongs_to :previous_token, Operately.Mcp.RefreshToken
    belongs_to :replaced_by_token, Operately.Mcp.RefreshToken

    timestamps()
  end

  def changeset(token, attrs) do
    token
    |> cast(attrs, [:grant_id, :token_hash, :resource, :scopes, :expires_at, :revoked_at, :used_at, :previous_token_id, :replaced_by_token_id])
    |> validate_required([:grant_id, :token_hash, :resource, :scopes, :expires_at])
    |> unique_constraint(:token_hash)
    |> foreign_key_constraint(:grant_id)
    |> foreign_key_constraint(:previous_token_id)
    |> foreign_key_constraint(:replaced_by_token_id)
  end
end
