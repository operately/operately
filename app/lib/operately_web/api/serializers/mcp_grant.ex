defimpl OperatelyWeb.Api.Serializable, for: Operately.Mcp.Grant do
  def serialize(grant, level: :essential) do
    %{
      id: OperatelyWeb.Paths.mcp_grant_id(grant),
      client_id: grant.client_id,
      client_name: grant.client_name,
      client_uri: grant.client_uri,
      scopes: grant.scopes || [],
      inserted_at: grant.inserted_at,
      last_used_at: Map.get(grant, :last_used_at)
    }
  end
end
