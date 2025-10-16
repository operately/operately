defmodule Operately.MCP.OAuth.AuthorizationCode do
  use Ecto.Schema

  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "mcp_oauth_authorizations" do
    field :code_hash, :binary
    field :code_challenge, :string
    field :code_challenge_method, :string
    field :redirect_uri, :string
    field :scope, :string
    field :client_id, :string
    field :resource, :string
    field :expires_at, :utc_datetime_usec

    belongs_to :account, Operately.People.Account
    belongs_to :company, Operately.Companies.Company

    timestamps()
  end

  @required ~w(code_hash code_challenge code_challenge_method redirect_uri client_id resource expires_at account_id company_id)a

  def changeset(struct, attrs) do
    struct
    |> cast(attrs, @required ++ [:scope])
    |> validate_required(@required)
  end
end
