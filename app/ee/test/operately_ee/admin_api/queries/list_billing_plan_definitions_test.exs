defmodule OperatelyEE.AdminApi.Queries.ListBillingPlanDefinitionsTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Account

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_query(ctx.conn, :list_billing_plan_definitions, %{})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} = admin_query(ctx.conn, :list_billing_plan_definitions, %{})
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

    test "returns the seeded plan definitions in sort order", ctx do
      assert {200, %{plan_definitions: plan_definitions}} =
               admin_query(ctx.conn, :list_billing_plan_definitions, %{})

      assert Enum.map(plan_definitions, & &1.key) == ["free", "team", "business", "unlimited"]
      assert Enum.map(plan_definitions, & &1.display_name) == ["Free", "Team", "Business", "Unlimited"]
      assert Enum.map(plan_definitions, & &1.sort_order) == [0, 1, 2, 3]
    end

    test "includes unlimited limits as nil", ctx do
      assert {200, %{plan_definitions: plan_definitions}} =
               admin_query(ctx.conn, :list_billing_plan_definitions, %{})

      unlimited = Enum.find(plan_definitions, &(&1.key == "unlimited"))

      assert unlimited.member_limit == nil
      assert unlimited.storage_limit_bytes == nil
    end
  end
end
