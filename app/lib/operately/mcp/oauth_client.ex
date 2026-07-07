defmodule Operately.Mcp.OAuthClient do
  @moduledoc """
  Persisted OAuth client created through dynamic client registration (RFC 7591).
  """

  use Operately.Schema

  @primary_key {:id, :binary_id, autogenerate: true}

  schema "mcp_registered_oauth_clients" do
    field :client_name, :string
    field :client_uri, :string
    field :logo_uri, :string
    field :redirect_uris, {:array, :string}, default: []
    field :token_endpoint_auth_method, :string, default: "none"
    field :grant_types, {:array, :string}, default: ["authorization_code"]
    field :response_types, {:array, :string}, default: ["code"]

    timestamps()
  end

  def changeset(client, attrs) do
    client
    |> cast(attrs, [
      :client_name,
      :client_uri,
      :logo_uri,
      :redirect_uris,
      :token_endpoint_auth_method,
      :grant_types,
      :response_types
    ])
    |> validate_required([:client_name, :redirect_uris, :token_endpoint_auth_method])
    |> validate_inclusion(:token_endpoint_auth_method, ["none"])
  end
end
