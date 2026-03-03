defimpl OperatelyWeb.Api.Serializable, for: Operately.People.ApiToken do
  def serialize(token, level: :essential) do
    %{
      id: OperatelyWeb.Paths.token_id(token),
      read_only: token.read_only,
    }
  end
end
