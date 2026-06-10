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
  import Mock

  alias Operately.Billing
  alias Operately.Billing.PlanDefinition
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
          polar_product_id: "prod_pro_monthly",
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
                 "id" => "prod_pro_monthly",
                 "name" => "Team Monthly Updated",
                 "prices" => [%{"amount_type" => "fixed", "price_amount" => 2900, "price_currency" => "usd"}],
                 "metadata" => ProductMapper.metadata(:team, :monthly, 1)
               }),
               unmanaged_product_payload(),
               managed_product_payload(%{
                 "id" => "prod_pro_yearly",
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

      imported_product = Billing.get_product_by_polar_product_id("prod_pro_yearly")
      assert imported_product.plan_family == "team"
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

    test "creates a missing provider-managed plan definition from valid snapshot metadata before importing the product" do
      put_client_response(fn [cursor: nil] ->
        {:ok,
         %{
           items: [
             managed_product_payload(%{
               "id" => "prod_enterprise_monthly",
               "name" => "Enterprise Monthly",
               "metadata" => enterprise_metadata("enterprise", "Enterprise", 8, 500, 5_497_558_138_880)
             })
           ],
           next_cursor: nil
         }}
      end)

      assert {:ok, 1} = ProductSync.run(client: MockClient)

      imported_product = Billing.get_product_by_polar_product_id("prod_enterprise_monthly")
      assert imported_product.plan_family == "enterprise"

      plan_definition =
        Billing.list_plan_definitions()
        |> Enum.find(&(&1.plan_key == "enterprise"))

      assert plan_definition.display_name == "Enterprise"
      assert plan_definition.tier_rank == 8
      assert plan_definition.billing_behavior == :provider_managed
      assert plan_definition.customer_selectable == true
      assert plan_definition.member_limit == 500
      assert plan_definition.storage_limit_bytes == 5_497_558_138_880
    end

    test "does not overwrite an existing local provider-managed plan definition when snapshot values differ" do
      create_plan_definition(%{
        plan_key: "enterprise",
        display_name: "Enterprise Local",
        tier_rank: 12,
        billing_behavior: :provider_managed,
        customer_selectable: false,
        member_limit: 250,
        storage_limit_bytes: 2_199_023_255_552
      })

      put_client_response(fn [cursor: nil] ->
        {:ok,
         %{
           items: [
             managed_product_payload(%{
               "id" => "prod_enterprise_yearly",
               "name" => "Enterprise Yearly",
               "recurring_interval" => "yearly",
               "metadata" => enterprise_metadata("enterprise", "Enterprise Provider", 8, 500, 5_497_558_138_880, "yearly")
             })
           ],
           next_cursor: nil
         }}
      end)

      assert {:ok, 1} = ProductSync.run(client: MockClient)

      plan_definition =
        Billing.list_plan_definitions()
        |> Enum.find(&(&1.plan_key == "enterprise"))

      assert plan_definition.display_name == "Enterprise Local"
      assert plan_definition.tier_rank == 12
      assert plan_definition.customer_selectable == false
      assert plan_definition.member_limit == 250
      assert plan_definition.storage_limit_bytes == 2_199_023_255_552
    end

    test "skips older metadata when the local provider-managed plan definition is missing and later items still sync" do
      put_client_response(fn [cursor: nil] ->
        {:ok,
         %{
           items: [
             managed_product_payload(%{
               "id" => "prod_enterprise_monthly",
               "name" => "Enterprise Monthly",
               "metadata" => ProductMapper.metadata("enterprise", :monthly, 1)
             }),
             managed_product_payload(%{
               "id" => "prod_team_yearly",
               "name" => "Team Yearly",
               "recurring_interval" => "yearly",
               "metadata" => ProductMapper.metadata(:team, :yearly, 1)
             })
           ],
           next_cursor: nil
         }}
      end)

      assert {:ok, 1} = ProductSync.run(client: MockClient)

      assert Billing.get_product_by_polar_product_id("prod_enterprise_monthly") == nil
      assert Billing.get_product_by_polar_product_id("prod_team_yearly").plan_family == "team"

      refute Enum.any?(Billing.list_plan_definitions(), &(&1.plan_key == "enterprise"))
    end

    test "skips invalid snapshot metadata when the local provider-managed plan definition is missing and later items still sync" do
      put_client_response(fn [cursor: nil] ->
        {:ok,
         %{
           items: [
             managed_product_payload(%{
               "id" => "prod_enterprise_monthly",
               "name" => "Enterprise Monthly",
               "metadata" =>
                 ProductMapper.metadata("enterprise", :monthly, 1)
                 |> Map.merge(%{
                   "operately_plan_display_name" => "Enterprise",
                   "operately_plan_tier_rank" => 8,
                   "operately_plan_customer_selectable" => "true",
                   "operately_plan_member_limit" => "500",
                   "operately_plan_storage_limit_bytes" => "5497558138880",
                   "operately_plan_metadata_version" => "not-a-number"
                 })
             }),
             managed_product_payload(%{
               "id" => "prod_team_yearly",
               "name" => "Team Yearly",
               "recurring_interval" => "yearly",
               "metadata" => ProductMapper.metadata(:team, :yearly, 1)
             })
           ],
           next_cursor: nil
         }}
      end)

      assert {:ok, 1} = ProductSync.run(client: MockClient)

      assert Billing.get_product_by_polar_product_id("prod_enterprise_monthly") == nil
      assert Billing.get_product_by_polar_product_id("prod_team_yearly").plan_family == "team"
    end

    test "skips products when an existing local plan with the same key is not provider-managed" do
      create_plan_definition(%{
        plan_key: "internal_support",
        display_name: "Internal Support",
        tier_rank: 8,
        billing_behavior: :internal,
        customer_selectable: false,
        member_limit: 100,
        storage_limit_bytes: nil
      })

      put_client_response(fn [cursor: nil] ->
        {:ok,
         %{
           items: [
             managed_product_payload(%{
               "id" => "prod_internal_support_monthly",
               "name" => "Internal Support Monthly",
               "metadata" => enterprise_metadata("internal_support", "Internal Support", 8, 100, nil)
             }),
             managed_product_payload(%{
               "id" => "prod_team_yearly",
               "name" => "Team Yearly",
               "recurring_interval" => "yearly",
               "metadata" => ProductMapper.metadata(:team, :yearly, 1)
             })
           ],
           next_cursor: nil
         }}
      end)

      assert {:ok, 1} = ProductSync.run(client: MockClient)

      assert Billing.get_product_by_polar_product_id("prod_internal_support_monthly") == nil
      assert Billing.get_product_by_polar_product_id("prod_team_yearly").plan_family == "team"
    end

    test "still fails the run when product upsert fails after successful plan bootstrap" do
      put_client_response(fn [cursor: nil] ->
        {:ok,
         %{
           items: [
             managed_product_payload(%{
               "id" => "prod_enterprise_monthly",
               "name" => "Enterprise Monthly",
               "metadata" => enterprise_metadata("enterprise", "Enterprise", 8, 500, 5_497_558_138_880)
             })
           ],
           next_cursor: nil
         }}
      end)

      with_mock Operately.Billing, [:passthrough],
        upsert_product_from_provider: fn _attrs -> {:error, :bad_request} end do
        assert {:error, :bad_request} = ProductSync.run(client: MockClient)
      end

      assert Enum.any?(Billing.list_plan_definitions(), &(&1.plan_key == "enterprise"))
      assert Billing.get_product_by_polar_product_id("prod_enterprise_monthly") == nil
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

  defp enterprise_metadata(plan_key, display_name, tier_rank, member_limit, storage_limit_bytes, billing_interval \\ "monthly") do
    ProductMapper.metadata(plan_key, billing_interval_to_atom(billing_interval), 1)
    |> Map.merge(%{
      "operately_plan_display_name" => display_name,
      "operately_plan_tier_rank" => tier_rank,
      "operately_plan_customer_selectable" => "true",
      "operately_plan_member_limit" => serialize_limit(member_limit),
      "operately_plan_storage_limit_bytes" => serialize_limit(storage_limit_bytes),
      "operately_plan_metadata_version" => 1
    })
  end

  defp billing_interval_to_atom("monthly"), do: :monthly
  defp billing_interval_to_atom("yearly"), do: :yearly

  defp serialize_limit(nil), do: "unlimited"
  defp serialize_limit(limit), do: Integer.to_string(limit)

  defp create_plan_definition(attrs) do
    %PlanDefinition{}
    |> PlanDefinition.changeset(attrs)
    |> Repo.insert!()
  end
end
