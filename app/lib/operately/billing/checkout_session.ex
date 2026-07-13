defmodule Operately.Billing.CheckoutSession do
  def __api_typename__, do: "billing_checkout_session"

  @enforce_keys [:provider, :id, :url, :return_url, :success_url, :expires_at]
  defstruct [:provider, :id, :url, :return_url, :success_url, :expires_at]

  def build(attrs) do
    struct!(__MODULE__, attrs)
  end
end
