defimpl OperatelyWeb.Api.Serializable, for: Operately.People.EmailChangeRequest do
  def serialize(request, level: :essential) do
    %{
      id: request.id,
      email: request.email,
      stage: request.stage,
      code_recipient: if(request.stage == :current_email, do: request.original_email, else: request.email),
      authorization_expires_at: Operately.People.EmailChange.Shared.authorization_expires_at(request),
      expires_at: request.expires_at,
      attempts_remaining: max(0, 5 - request.attempts),
      sent_at: request.sent_at
    }
  end
end
