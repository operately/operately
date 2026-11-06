defmodule OperatelyWeb.Api.ResourceHubs.CreateTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space, company_permissions: 0)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_resource_hub(:other_hub, :space, :creator)
      |> Factory.log_in_person(:creator)

    ctx
  end

  test "manages collections with space edit permission", ctx do
    assert {200, _} = mutation(ctx.conn, [:resource_hubs, :create], inputs(ctx))
    assert Repo.get_by!(Operately.ResourceHubs.ResourceHub, space_id: ctx.space.id, name: "Design")
  end

  test "rejects blank names without creating a collection", ctx do
    count = Repo.aggregate(Operately.ResourceHubs.ResourceHub, :count)
    assert {400, _} = mutation(ctx.conn, [:resource_hubs, :create], %{space_id: ctx.space.id, name: "   "})
    assert Repo.aggregate(Operately.ResourceHubs.ResourceHub, :count) == count
  end

  test "rejects a member without space access", ctx do
    ctx = ctx |> Factory.add_company_member(:person) |> Factory.log_in_person(:person)
    assert {404, _} = mutation(ctx.conn, [:resource_hubs, :create], inputs(ctx))
  end

  test "rejects view-only access", ctx do
    ctx = ctx |> Factory.add_company_member(:person) |> Factory.log_in_person(:person)
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: ctx.person.id, access_level: Operately.Access.Binding.view_access()}])
    assert {403, _} = mutation(ctx.conn, [:resource_hubs, :create], inputs(ctx))
  end

  test "rejects read-only company writes", ctx do
    {:ok, account} = Operately.Billing.get_or_create_billing_account(ctx.company)
    {:ok, _} = Operately.Billing.update_billing_account(account, %{access_state: :read_only, access_state_reason: :past_due, access_state_started_at: DateTime.utc_now()})
    assert {403, _} = mutation(ctx.conn, [:resource_hubs, :create], inputs(ctx))
  end

  defp inputs(ctx), do: %{space_id: ctx.space.id, name: "Design"}
end
