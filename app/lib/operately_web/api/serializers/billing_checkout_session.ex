defimpl OperatelyWeb.Api.Serializable, for: Operately.Billing.CheckoutSession do
  def serialize(session, level: :essential) do
    %{
      provider: session.provider,
      id: session.id,
      url: session.url,
      return_url: session.return_url,
      success_url: session.success_url,
      expires_at: session.expires_at
    }
  end
end
