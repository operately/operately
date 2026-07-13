defmodule Operately.Billing.HostedSession do
  def __api_typename__, do: "billing_hosted_session"

  @enforce_keys [:provider, :url, :return_url, :expires_at]
  defstruct [:provider, :url, :return_url, :expires_at]

  def build(attrs) do
    struct!(__MODULE__, attrs)
  end
end
