defmodule OperatelyEE.AdminApi.Mutations.CreateBillingPlanDefinitionTest do
  use OperatelyWeb.TurboCase

  alias Operately.Billing
  alias Operately.People.Account

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :create_billing_plan_definition, valid_input())
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :create_billing_plan_definition, valid_input())
    end
  end

  describe "functionality" do
    setup ctx do
      Application.put_env(:operately, :billing_enabled, true)
      on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

      ctx = Factory.setup(ctx)
      {:ok, _} = Account.promote_to_admin(ctx.account)

      ctx
      |> Map.put(:account, Repo.get!(Account, ctx.account.id))
      |> Factory.log_in_account(:account)
    end

    test "creates a provider-managed selectable plan and normalizes its key", ctx do
      assert {200, %{plan_definition: plan_definition}} =
               admin_mutation(ctx.conn, :create_billing_plan_definition, %{
                 plan_key: "  Enterprise  ",
                 display_name: "Enterprise",
                 tier_rank: 8,
                 billing_behavior: "provider_managed",
                 customer_selectable: true,
                 member_limit: 500,
                 storage_limit_bytes: 5_497_558_138_880
               })

      assert plan_definition.key == "enterprise"
      assert plan_definition.display_name == "Enterprise"
      assert plan_definition.tier_rank == 8
      assert plan_definition.billing_behavior == "provider_managed"
      assert plan_definition.customer_selectable == true
      assert plan_definition.archived_at == nil

      reloaded = Billing.list_plan_definitions() |> Enum.find(&(&1.plan_key == "enterprise"))
      assert reloaded.billing_behavior == :provider_managed
      assert reloaded.customer_selectable == true
    end

    test "creates an internal plan with customer_selectable false", ctx do
      assert {200, %{plan_definition: plan_definition}} =
               admin_mutation(ctx.conn, :create_billing_plan_definition, %{
                 plan_key: "Trial_90_Day",
                 display_name: "Trial 90 Day",
                 tier_rank: 9,
                 billing_behavior: "internal",
                 customer_selectable: false,
                 member_limit: 75,
                 storage_limit_bytes: nil
               })

      assert plan_definition.key == "trial_90_day"
      assert plan_definition.billing_behavior == "internal"
      assert plan_definition.customer_selectable == false
    end

    test "rejects internal plans that are customer selectable", ctx do
      assert {400, _} =
               admin_mutation(ctx.conn, :create_billing_plan_definition, %{
                 plan_key: "staff_only",
                 display_name: "Staff Only",
                 tier_rank: 10,
                 billing_behavior: "internal",
                 customer_selectable: true,
                 member_limit: nil,
                 storage_limit_bytes: nil
               })
    end
  end

  defp valid_input do
    %{
      plan_key: "enterprise",
      display_name: "Enterprise",
      tier_rank: 8,
      billing_behavior: "provider_managed",
      customer_selectable: true,
      member_limit: 500,
      storage_limit_bytes: 5_497_558_138_880
    }
  end
end
