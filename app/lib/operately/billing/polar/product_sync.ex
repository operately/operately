defmodule Operately.Billing.Polar.ProductSync do
  @moduledoc """
  Stub for syncing product catalog from Polar.

  Full implementation will:
  1. Fetch products from Polar API
  2. Upsert into billing_products table
  3. Deactivate superseded versions
  4. Return {:ok, count} or {:error, reason}

  Called by the admin API mutation and eventually by a scheduled job.
  """

  def run do
    # TODO: Implement Polar API integration in PR 4
    {:ok, 0}
  end
end
