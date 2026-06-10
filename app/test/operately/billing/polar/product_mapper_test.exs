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

    test "builds enriched managed metadata for finite plan definitions" do
      plan_definition =
        create_plan_definition(%{
          plan_key: "enterprise",
          display_name: "Enterprise",
          tier_rank: 10,
          billing_behavior: :provider_managed,
          customer_selectable: true,
          member_limit: 500,
          storage_limit_bytes: 5_497_558_138_880
        })

      assert ProductMapper.metadata(plan_definition, :monthly, 3) == %{
               "operately_managed" => "true",
               "operately_plan_family" => "enterprise",
               "operately_billing_interval" => "monthly",
               "operately_version" => 3,
               "operately_plan_display_name" => "Enterprise",
               "operately_plan_tier_rank" => 10,
               "operately_plan_customer_selectable" => "true",
               "operately_plan_member_limit" => "500",
               "operately_plan_storage_limit_bytes" => "5497558138880",
               "operately_plan_metadata_version" => 1
             }
    end

    test "builds enriched managed metadata for unbounded plan definitions" do
      plan_definition = Repo.get_by!(PlanDefinition, plan_key: "unlimited")

      assert ProductMapper.metadata(plan_definition, :yearly, 2) == %{
               "operately_managed" => "true",
               "operately_plan_family" => "unlimited",
               "operately_billing_interval" => "yearly",
               "operately_version" => 2,
               "operately_plan_display_name" => "Unlimited",
               "operately_plan_tier_rank" => 3,
               "operately_plan_customer_selectable" => "true",
               "operately_plan_member_limit" => "unlimited",
               "operately_plan_storage_limit_bytes" => "unlimited",
               "operately_plan_metadata_version" => 1
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

      assert {:ok, %{product_attrs: attrs, plan_definition_snapshot: :missing}} = ProductMapper.normalize_provider_product(payload)

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

      assert {:ok, %{product_attrs: attrs, plan_definition_snapshot: :missing}} = ProductMapper.normalize_provider_product(payload)

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

      assert {:ok, %{product_attrs: attrs, plan_definition_snapshot: :missing}} = ProductMapper.normalize_provider_product(payload)
      assert attrs.plan_family == "enterprise"
    end

    test "parses a valid plan-definition snapshot from enriched metadata" do
      plan_definition =
        create_plan_definition(%{
          plan_key: "enterprise",
          display_name: "Enterprise",
          tier_rank: 10,
          billing_behavior: :provider_managed,
          customer_selectable: true,
          member_limit: 500,
          storage_limit_bytes: 5_497_558_138_880
        })

      payload =
        managed_product_payload(%{
          "metadata" => ProductMapper.metadata(plan_definition, :monthly, 1)
        })

      assert {:ok, %{product_attrs: attrs, plan_definition_snapshot: {:valid, snapshot}}} = ProductMapper.normalize_provider_product(payload)

      assert attrs.plan_family == "enterprise"

      assert snapshot == %{
               metadata_version: 1,
               plan_definition_attrs: %{
                 plan_key: "enterprise",
                 display_name: "Enterprise",
                 tier_rank: 10,
                 billing_behavior: :provider_managed,
                 customer_selectable: true,
                 member_limit: 500,
                 storage_limit_bytes: 5_497_558_138_880,
                 archived_at: nil
               }
             }
    end

    test "preserves product attrs when snapshot metadata is malformed" do
      payload =
        managed_product_payload(%{
          "metadata" =>
            ProductMapper.metadata(:team, :monthly, 1)
            |> Map.merge(%{
              "operately_plan_display_name" => "Team",
              "operately_plan_tier_rank" => 1,
              "operately_plan_customer_selectable" => "true",
              "operately_plan_member_limit" => "50",
              "operately_plan_storage_limit_bytes" => "107374182400",
              "operately_plan_metadata_version" => "not-a-number"
            })
        })

      assert {:ok, %{product_attrs: attrs, plan_definition_snapshot: {:invalid, :invalid_plan_metadata_version}}} =
               ProductMapper.normalize_provider_product(payload)

      assert attrs.plan_family == "team"
      assert attrs.billing_interval == :monthly
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
