defmodule Operately.Billing.InputsTest do
  use Operately.DataCase, async: true

  alias Operately.Billing.Inputs
  alias Operately.Billing.PlanDefinition
  alias Operately.Repo

  describe "cast_billing_interval/1" do
    test "accepts canonical billing intervals as atoms and strings" do
      assert {:ok, :monthly} = Inputs.cast_billing_interval(:monthly)
      assert {:ok, :yearly} = Inputs.cast_billing_interval(:yearly)
      assert {:ok, :monthly} = Inputs.cast_billing_interval("monthly")
      assert {:ok, :yearly} = Inputs.cast_billing_interval("YEARLY")
    end

    test "rejects invalid billing intervals" do
      assert {:error, :invalid_billing_interval} = Inputs.cast_billing_interval("weekly")
      assert {:error, :invalid_billing_interval} = Inputs.cast_billing_interval(nil)
    end
  end

  describe "cast_customer_billing_intent/2" do
    test "ignores incomplete billing intent" do
      assert :ignore = Inputs.cast_customer_billing_intent(nil, "monthly")
      assert :ignore = Inputs.cast_customer_billing_intent("team", nil)
    end

    test "normalizes a valid selectable billing intent" do
      assert {:ok, "team", :monthly} = Inputs.cast_customer_billing_intent("TEAM", "monthly")
    end

    test "accepts arbitrary selectable plans defined in the database" do
      create_plan_definition(%{
        plan_key: "enterprise",
        display_name: "Enterprise",
        billing_behavior: :provider_managed,
        customer_selectable: true
      })

      assert {:ok, "enterprise", :yearly} = Inputs.cast_customer_billing_intent("enterprise", "yearly")
    end

    test "rejects invalid plans and intervals" do
      assert {:error, :invalid_plan_key} = Inputs.cast_customer_billing_intent("free", "monthly")
      assert {:error, :invalid_plan_key} = Inputs.cast_customer_billing_intent("does-not-exist", "monthly")
      assert {:error, :invalid_billing_interval} = Inputs.cast_customer_billing_intent("team", "weekly")
    end
  end

  describe "cast_provider_managed_plan_key/1" do
    test "accepts arbitrary provider-managed plans defined in the database" do
      create_plan_definition(%{
        plan_key: "enterprise_internal_checkout",
        display_name: "Enterprise Checkout",
        billing_behavior: :provider_managed
      })

      assert {:ok, "enterprise_internal_checkout"} = Inputs.cast_provider_managed_plan_key("ENTERPRISE_INTERNAL_CHECKOUT")
    end

    test "rejects internal plans" do
      create_plan_definition(%{
        plan_key: "staff_only",
        display_name: "Staff Only",
        billing_behavior: :internal
      })

      assert {:error, :invalid_plan_key} = Inputs.cast_provider_managed_plan_key("staff_only")
    end
  end

  defp create_plan_definition(attrs) do
    unique = System.unique_integer([:positive])

    attrs =
      Enum.into(attrs, %{
        plan_key: "plan_#{unique}",
        display_name: "Plan #{unique}",
        sort_order: 100 + unique,
        tier_rank: 100 + unique,
        billing_behavior: :internal,
        customer_selectable: false,
        member_limit: 10,
        storage_limit_bytes: 1_024
      })

    %PlanDefinition{}
    |> PlanDefinition.changeset(attrs)
    |> Repo.insert!()
  end
end
