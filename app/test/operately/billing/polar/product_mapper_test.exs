defmodule Operately.Billing.Polar.ProductMapperTest do
  use Operately.DataCase, async: true

  alias Operately.Billing.PlanDefinition
  alias Operately.Billing.Polar.ProductMapper
  alias Operately.Repo

  describe "metadata/3" do
    test "builds the managed metadata stored on Polar products" do
      assert ProductMapper.metadata(:team, :monthly, 3) == %{
               "operately_managed" => "true",
               "operately_plan_family" => "team",
               "operately_billing_interval" => "monthly",
               "operately_version" => 3
             }
    end
  end

  describe "normalize_provider_product/1" do
    test "normalizes a managed product into local catalog attrs" do
      payload =
        managed_product_payload(%{
          "id" => "prod_pro_monthly_v2",
          "name" => "Team Monthly v2",
          "recurring_interval" => "monthly",
          "prices" => [
            %{"amount_type" => "metered", "price_amount" => 9999, "price_currency" => "usd"},
            %{"amount_type" => "fixed", "price_amount" => 2900, "price_currency" => "USD"}
          ],
          "metadata" => ProductMapper.metadata(:team, :monthly, 2)
        })

      assert {:ok, attrs} = ProductMapper.normalize_provider_product(payload)

      assert attrs.provider == "polar"
      assert attrs.plan_family == "team"
      assert attrs.billing_interval == :monthly
      assert attrs.polar_product_id == "prod_pro_monthly_v2"
      assert attrs.polar_product_name == "Team Monthly v2"
      assert attrs.price_amount == 2900
      assert attrs.price_currency == "usd"
      assert attrs.version == 2
      assert attrs.archived_at == nil
      assert attrs.provider_payload == payload
      assert %DateTime{} = attrs.last_synced_at
    end

    test "accepts alternate provider field shapes and archived products" do
      payload =
        managed_product_payload(%{
          "name" => "Business Yearly",
          "recurring_interval" => nil,
          "recurring" => %{"interval" => "year"},
          "prices" => nil,
          "price_options" => [%{"amountType" => "fixed", "amount" => 19_900, "currency" => "EUR"}],
          "metadata" => %{
            "operately_managed" => true,
            "operately_plan_family" => "business",
            "operately_billing_interval" => "yearly",
            "operately_version" => "4"
          },
          "isArchived" => true,
          "archivedAt" => "2026-01-02T03:04:05Z"
        })

      assert {:ok, attrs} = ProductMapper.normalize_provider_product(payload)

      assert attrs.plan_family == "business"
      assert attrs.billing_interval == :yearly
      assert attrs.price_amount == 19_900
      assert attrs.price_currency == "eur"
      assert attrs.version == 4
      assert attrs.archived_at == ~U[2026-01-02 03:04:05Z]
    end

    test "accepts custom provider-managed plan families from plan definitions" do
      create_plan_definition(%{
        plan_key: "enterprise",
        display_name: "Enterprise",
        sort_order: 10,
        tier_rank: 10,
        billing_behavior: :provider_managed,
        customer_selectable: true,
        member_limit: 500,
        storage_limit_bytes: 5_497_558_138_880
      })

      payload =
        managed_product_payload(%{
          "metadata" => %{
            "operately_managed" => "true",
            "operately_plan_family" => "enterprise",
            "operately_billing_interval" => "monthly",
            "operately_version" => 1
          }
        })

      assert {:ok, attrs} = ProductMapper.normalize_provider_product(payload)
      assert attrs.plan_family == "enterprise"
    end

    test "ignores products that are not marked as Operately-managed" do
      payload =
        managed_product_payload(%{
          "metadata" => %{
            "operately_plan_family" => "team",
            "operately_billing_interval" => "monthly",
            "operately_version" => 1
          }
        })

      assert :ignore = ProductMapper.normalize_provider_product(payload)
    end

    test "ignores products whose metadata interval does not match the provider interval" do
      payload =
        managed_product_payload(%{
          "recurring_interval" => "year",
          "metadata" => ProductMapper.metadata(:team, :monthly, 1)
        })

      assert :ignore = ProductMapper.normalize_provider_product(payload)
    end

    test "ignores products with invalid Operately metadata" do
      payload =
        managed_product_payload(%{
          "metadata" => %{
            "operately_managed" => "true",
            "operately_plan_family" => "enterprise",
            "operately_billing_interval" => "monthly",
            "operately_version" => "not-a-number"
          }
        })

      assert :ignore = ProductMapper.normalize_provider_product(payload)
    end
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

  defp create_plan_definition(attrs) do
    %PlanDefinition{}
    |> PlanDefinition.changeset(attrs)
    |> Repo.insert!()
  end
end
