defimpl OperatelyWeb.Api.Serializable, for: Operately.People.ApiToken do
  def serialize(token, level: :essential) do
    %{
      id: OperatelyWeb.Paths.token_id(token),
      read_only: token.read_only,
      name: token.name,
      inserted_at: token.inserted_at,
      last_used_at: token.last_used_at
    }
  end
end
