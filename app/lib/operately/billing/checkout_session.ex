defmodule Operately.Billing.CheckoutSession do
  @enforce_keys [:provider, :id, :url, :return_url, :success_url, :expires_at]
  defstruct [:provider, :id, :url, :return_url, :success_url, :expires_at]

  def build(attrs) do
    struct!(__MODULE__, attrs)
  end
end
