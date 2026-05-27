defmodule Operately.Support.FakePolarClient do
  @moduledoc """
  Test-only Polar client for billing feature tests.

  Flow:

  1. A feature test sets `:billing_polar_client` to this module.
  2. The same test stores handler functions in `:billing_polar_test_handlers`.
  3. When billing code calls a Polar function, this module looks up the handler
     by name and calls it with the original arguments.

  That makes the fake work across the real Phoenix request and Oban worker
  processes spawned during a browser test.
  """

  alias Operately.Billing.Polar.Client

  def get_customer_state_by_external_id(company_id) do
    call!(:get_customer_state_by_external_id, [company_id])
  end

  def create_checkout_session(attrs) do
    call!(:create_checkout_session, [attrs])
  end

  def update_subscription(subscription_id, attrs) do
    call!(:update_subscription, [subscription_id, attrs])
  end

  def app_base_url do
    Client.app_base_url()
  end

  defp call!(name, args) do
    handlers = Application.get_env(:operately, :billing_polar_test_handlers, %{})

    case Map.get(handlers, name) do
      handler when is_function(handler) ->
        apply(handler, args)

      nil ->
        raise "FakePolarClient handler not configured for #{name}"
    end
  end
end
