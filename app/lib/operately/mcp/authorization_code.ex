defmodule Operately.Mcp.AuthorizationCode do
  use Operately.Schema

  schema "mcp_authorization_codes" do
    field :code_hash, :binary
    field :redirect_uri, :string
    field :resource, :string
    field :scopes, {:array, :string}, default: []
    field :code_challenge, :string
    field :code_challenge_method, :string
    field :expires_at, :utc_datetime
    field :consumed_at, :utc_datetime

    belongs_to :grant, Operately.Mcp.Grant

    timestamps()
  end

  def changeset(code, attrs) do
    code
    |> cast(attrs, [:grant_id, :code_hash, :redirect_uri, :resource, :scopes, :code_challenge, :code_challenge_method, :expires_at, :consumed_at])
    |> validate_required([:grant_id, :code_hash, :redirect_uri, :resource, :scopes, :code_challenge, :code_challenge_method, :expires_at])
    |> unique_constraint(:code_hash)
    |> foreign_key_constraint(:grant_id)
  end
end
