defmodule OperatelyEE.AdminApi.Mutations.UpdateBillingPlanDefinitionTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Account
  alias Operately.Billing

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :update_billing_plan_definition, %{
                 id: Operately.ShortUuid.encode!(Ecto.UUID.generate()),
                 display_name: "Updated",
                 tier_rank: 1
               })
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :update_billing_plan_definition, %{
                 id: Operately.ShortUuid.encode!(Ecto.UUID.generate()),
                 display_name: "Updated",
                 tier_rank: 1
               })
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      {:ok, _} = Account.promote_to_admin(ctx.account)

      ctx
      |> Map.put(:account, Repo.get!(Account, ctx.account.id))
      |> Factory.log_in_account(:account)
    end

    test "updates editable fields on a plan definition", ctx do
      team_plan =
        Billing.list_plan_definitions()
        |> Enum.find(&(&1.plan_key == "team"))

      assert {200, %{plan_definition: updated}} =
               admin_mutation(ctx.conn, :update_billing_plan_definition, %{
                 id: OperatelyWeb.Paths.billing_plan_definition_id(team_plan),
                 display_name: "Team Plus",
                 tier_rank: 9,
                 billing_behavior: "provider_managed",
                 customer_selectable: true,
                 member_limit: 75,
                 storage_limit_bytes: 250_000
               })

      assert updated.display_name == "Team Plus"
      assert updated.tier_rank == 9
      assert updated.billing_behavior == "provider_managed"
      assert updated.customer_selectable == true
      assert updated.member_limit == 75
      assert updated.storage_limit_bytes == 250_000

      reloaded = Billing.get_plan_definition!(team_plan.id)
      assert reloaded.display_name == "Team Plus"
      assert reloaded.tier_rank == 9
      assert reloaded.billing_behavior == :provider_managed
      assert reloaded.customer_selectable == true
      assert reloaded.member_limit == 75
      assert reloaded.storage_limit_bytes == 250_000
    end

    test "supports unlimited limits with nil values", ctx do
      unlimited_plan =
        Billing.list_plan_definitions()
        |> Enum.find(&(&1.plan_key == "unlimited"))

      assert {200, %{plan_definition: updated}} =
               admin_mutation(ctx.conn, :update_billing_plan_definition, %{
                 id: OperatelyWeb.Paths.billing_plan_definition_id(unlimited_plan),
                 display_name: "Unlimited",
                 tier_rank: 3,
                 billing_behavior: "provider_managed",
                 customer_selectable: true,
                 member_limit: nil,
                 storage_limit_bytes: nil
               })

      assert updated.member_limit == nil
      assert updated.storage_limit_bytes == nil
    end

    test "rejects making an internal plan customer selectable", ctx do
      free_plan =
        Billing.list_plan_definitions()
        |> Enum.find(&(&1.plan_key == "free"))

      assert {400, _} =
               admin_mutation(ctx.conn, :update_billing_plan_definition, %{
                 id: OperatelyWeb.Paths.billing_plan_definition_id(free_plan),
                 display_name: "Free",
                 tier_rank: 0,
                 billing_behavior: "internal",
                 customer_selectable: true,
                 member_limit: 20,
                 storage_limit_bytes: 1_073_741_824
               })
    end
  end
end
