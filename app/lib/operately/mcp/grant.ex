defmodule Operately.Mcp.Grant do
  use Operately.Schema

  schema "mcp_grants" do
    field :client_id, :string
    field :client_name, :string
    field :client_uri, :string
    field :redirect_uri, :string
    field :resource, :string
    field :scopes, {:array, :string}, default: []
    field :revoked_at, :utc_datetime

    belongs_to :account, Operately.People.Account
    belongs_to :company, Operately.Companies.Company

    timestamps()
  end

  def changeset(grant, attrs) do
    grant
    |> cast(attrs, [:account_id, :company_id, :client_id, :client_name, :client_uri, :redirect_uri, :resource, :scopes, :revoked_at])
    |> validate_required([:account_id, :company_id, :client_id, :client_name, :redirect_uri, :resource, :scopes])
    |> unique_constraint([:account_id, :company_id, :client_id])
    |> foreign_key_constraint(:account_id)
    |> foreign_key_constraint(:company_id)
  end
end
