defimpl OperatelyWeb.Api.Serializable, for: Operately.People.EmailChange.State do
  alias OperatelyWeb.Api.Serializer

  def serialize(state, level: :essential) do
    %{
      current_email: state.current_email,
      pending: Serializer.serialize(state.pending),
      retry_after: state.retry_after
    }
  end
end
