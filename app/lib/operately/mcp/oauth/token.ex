defmodule Operately.MCP.OAuth.Token do
  use Ecto.Schema

  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "mcp_oauth_tokens" do
    field :access_token_hash, :binary
    field :refresh_token_hash, :binary
    field :access_token_expires_at, :utc_datetime_usec
    field :refresh_token_expires_at, :utc_datetime_usec
    field :scope, :string
    field :client_id, :string
    field :resource, :string
    field :revoked_at, :utc_datetime_usec

    belongs_to :account, Operately.People.Account
    belongs_to :company, Operately.Companies.Company

    timestamps()
  end

  @required ~w(access_token_hash refresh_token_hash access_token_expires_at refresh_token_expires_at client_id resource account_id company_id)a

  def changeset(struct, attrs) do
    struct
    |> cast(attrs, @required ++ [:scope, :revoked_at])
    |> validate_required(@required)
  end
end
