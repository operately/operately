defmodule Operately.Billing.Polar.Operations.ProductSyncTest.MockClient do
  def list_products(opts) do
    send(self(), {:mock_client_called, opts})

    case Process.get({__MODULE__, :handler}) do
      nil -> raise "MockClient handler not configured"
      handler -> handler.(opts)
    end
  end
end

defmodule Operately.Billing.Polar.Operations.ProductSyncTest do
  use Operately.DataCase, async: true

  alias Operately.Billing
  alias Operately.Billing.Polar.ProductMapper
  alias Operately.Billing.Polar.Operations.ProductSync
  alias __MODULE__.MockClient

  describe "run/1" do
    test "syncs managed products across pages and ignores unmanaged ones" do
      {:ok, existing_product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_team_monthly",
          polar_product_name: "Team Monthly",
          price_amount: 1900,
          price_currency: "usd",
          version: 1,
          active: true
        })

      {:ok, archived_product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "business",
          billing_interval: "yearly",
          polar_product_id: "prod_business_yearly",
          polar_product_name: "Business Yearly",
          price_amount: 99_000,
          price_currency: "usd",
          version: 1,
          active: true
        })

      put_client_response(fn
        [cursor: nil] ->
          {:ok,
           %{
             items: [
               managed_product_payload(%{
                 "id" => "prod_team_monthly",
                 "name" => "Team Monthly Updated",
                 "prices" => [%{"amount_type" => "fixed", "price_amount" => 2900, "price_currency" => "usd"}],
                 "metadata" => ProductMapper.metadata(:team, :monthly, 1)
               }),
               unmanaged_product_payload(),
               managed_product_payload(%{
                 "id" => "prod_team_yearly",
                 "name" => "Team Yearly",
                 "recurring_interval" => "yearly",
                 "prices" => [%{"amount_type" => "fixed", "price_amount" => 29_900, "price_currency" => "usd"}],
                 "metadata" => ProductMapper.metadata(:team, :yearly, 1)
               })
             ],
             next_cursor: "page-2"
           }}

        [cursor: "page-2"] ->
          {:ok,
           %{
             items: [
               managed_product_payload(%{
                 "id" => "prod_business_yearly",
                 "name" => "Business Yearly Archived",
                 "recurring_interval" => "yearly",
                 "prices" => [%{"amount_type" => "fixed", "price_amount" => 109_000, "price_currency" => "usd"}],
                 "metadata" => ProductMapper.metadata(:business, :yearly, 2),
                 "is_archived" => true
               })
             ],
             next_cursor: nil
           }}
      end)

      assert {:ok, 3} = ProductSync.run(client: MockClient)
      assert_received {:mock_client_called, [cursor: nil]}
      assert_received {:mock_client_called, [cursor: "page-2"]}

      existing_product = Billing.get_product!(existing_product.id)
      assert existing_product.active == true
      assert existing_product.polar_product_name == "Team Monthly Updated"
      assert existing_product.price_amount == 2900
      assert existing_product.version == 1

      imported_product = Billing.get_product_by_polar_product_id("prod_team_yearly")
      assert imported_product.plan_family == :team
      assert imported_product.billing_interval == :yearly
      assert imported_product.price_amount == 29_900
      assert imported_product.active == false
      assert imported_product.version == 1

      archived_product = Billing.get_product!(archived_product.id)
      assert archived_product.active == false
      assert archived_product.polar_product_name == "Business Yearly Archived"
      assert archived_product.price_amount == 109_000
      assert archived_product.version == 2
      assert archived_product.archived_at

      assert Billing.get_product_by_polar_product_id("prod_manual") == nil
    end

    test "returns provider errors from the client" do
      put_client_response(fn [cursor: nil] ->
        {:error, :internal_server_error}
      end)

      assert {:error, :internal_server_error} = ProductSync.run(client: MockClient)
      assert_received {:mock_client_called, [cursor: nil]}
    end
  end

  defp put_client_response(handler) do
    Process.put({MockClient, :handler}, handler)
  end

  defp managed_product_payload(overrides) do
    Map.merge(
      %{
        "id" => "prod_test",
        "name" => "Managed Product",
        "recurring_interval" => "monthly",
        "prices" => [%{"amount_type" => "fixed", "price_amount" => 2900, "price_currency" => "usd"}],
        "metadata" => ProductMapper.metadata(:team, :monthly, 1),
        "is_archived" => false
      },
      overrides
    )
  end

  defp unmanaged_product_payload do
    %{
      "id" => "prod_manual",
      "name" => "Manual Product",
      "recurring_interval" => "monthly",
      "prices" => [%{"amount_type" => "fixed", "price_amount" => 1900, "price_currency" => "usd"}],
      "metadata" => %{},
      "is_archived" => false
    }
  end
end
