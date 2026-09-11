defimpl OperatelyWeb.Api.Serializable, for: Operately.People.EmailChangeRequest do
  def serialize(request, level: :essential) do
    %{
      id: request.id,
      email: request.email,
      expires_at: request.expires_at,
      attempts_remaining: max(0, 5 - request.attempts),
      sent_at: request.sent_at
    }
  end
end
