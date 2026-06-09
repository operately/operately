defmodule OperatelyEE.AdminApi.Mutations.UnarchiveBillingPlanDefinitionTest do
  use OperatelyWeb.TurboCase

  alias Operately.Billing
  alias Operately.People.Account

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :unarchive_billing_plan_definition, %{id: Operately.ShortUuid.encode!(Ecto.UUID.generate())})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :unarchive_billing_plan_definition, %{id: Operately.ShortUuid.encode!(Ecto.UUID.generate())})
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

    test "unarchives a plan", ctx do
      team_plan =
        Billing.list_plan_definitions()
        |> Enum.find(&(&1.plan_key == "team"))

      {:ok, archived_plan} = Billing.archive_plan_definition(team_plan)

      assert {200, %{plan_definition: unarchived}} =
               admin_mutation(ctx.conn, :unarchive_billing_plan_definition, %{
                 id: OperatelyWeb.Paths.billing_plan_definition_id(archived_plan)
               })

      assert unarchived.archived_at == nil
      assert Billing.get_plan_definition!(team_plan.id).archived_at == nil
    end

    test "returns an error when unarchiving would conflict with active uniqueness", ctx do
      {:ok, archived_plan} =
        Billing.create_plan_definition(%{
          plan_key: "enterprise_archive_conflict",
          display_name: "Enterprise",
          sort_order: 10,
          tier_rank: 10,
          billing_behavior: :provider_managed,
          customer_selectable: true,
          member_limit: 500,
          storage_limit_bytes: 5_497_558_138_880,
          archived_at: DateTime.utc_now()
        })

      assert {200, %{plan_definition: _}} =
               admin_mutation(ctx.conn, :create_billing_plan_definition, %{
                 plan_key: "enterprise_active_conflict",
                 display_name: "Enterprise Active",
                 sort_order: 10,
                 tier_rank: 10,
                 billing_behavior: "provider_managed",
                 customer_selectable: true,
                 member_limit: 600,
                 storage_limit_bytes: 6_597_069_766_656
               })

      assert {400, _} =
               admin_mutation(ctx.conn, :unarchive_billing_plan_definition, %{
                 id: OperatelyWeb.Paths.billing_plan_definition_id(archived_plan)
               })
    end
  end
end
