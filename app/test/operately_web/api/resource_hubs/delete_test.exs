defmodule OperatelyWeb.Api.ResourceHubs.DeleteTest do
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
    assert {200, %{success: true}} = mutation(ctx.conn, [:resource_hubs, :delete], inputs(ctx))
    refute Repo.get(Operately.ResourceHubs.ResourceHub, ctx.other_hub.id)
    assert Repo.reload!(ctx.space).default_resource_hub_id == ctx.hub.id
  end

  test "rejects a member without space access", ctx do
    ctx = ctx |> Factory.add_company_member(:person) |> Factory.log_in_person(:person)
    assert {404, _} = mutation(ctx.conn, [:resource_hubs, :delete], inputs(ctx))
  end

  test "rejects view-only access", ctx do
    ctx = ctx |> Factory.add_company_member(:person) |> Factory.log_in_person(:person)
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: ctx.person.id, access_level: Operately.Access.Binding.view_access()}])
    assert {403, _} = mutation(ctx.conn, [:resource_hubs, :delete], inputs(ctx))
  end

  test "rejects read-only company writes", ctx do
    {:ok, account} = Operately.Billing.get_or_create_billing_account(ctx.company)
    {:ok, _} = Operately.Billing.update_billing_account(account, %{access_state: :read_only, access_state_reason: :past_due, access_state_started_at: DateTime.utc_now()})
    assert {403, _} = mutation(ctx.conn, [:resource_hubs, :delete], inputs(ctx))
  end

  test "rejects deleting the default, including when a replacement is supplied", ctx do
    assert {400, %{details: %{code: "default_resource_hub_deletion_forbidden"}}} =
             mutation(ctx.conn, [:resource_hubs, :delete], %{resource_hub_id: ctx.hub.id})

    assert {400, _} = mutation(ctx.conn, [:resource_hubs, :delete], %{resource_hub_id: ctx.hub.id, replacement_resource_hub_id: ctx.other_hub.id})
    assert Repo.reload!(ctx.hub)
    assert Repo.reload!(ctx.space).default_resource_hub_id == ctx.hub.id
  end

  test "returns an actionable error without deleting nonempty hubs", ctx do
    ctx = Factory.add_folder(ctx, :folder, :other_hub)
    assert {400, %{details: %{code: "resource_hub_not_empty"}}} = mutation(ctx.conn, [:resource_hubs, :delete], inputs(ctx))
    assert Repo.reload!(ctx.folder)
    assert Repo.reload!(ctx.space).default_resource_hub_id == ctx.hub.id
  end

  defp inputs(ctx), do: %{resource_hub_id: ctx.other_hub.id}
end
