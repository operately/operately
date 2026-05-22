defimpl OperatelyWeb.Api.Serializable, for: Operately.Billing.HostedSession do
  def serialize(session, level: :essential) do
    %{
      provider: session.provider,
      url: session.url,
      return_url: session.return_url,
      expires_at: session.expires_at
    }
  end
end
