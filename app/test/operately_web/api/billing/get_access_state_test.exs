defmodule OperatelyWeb.Api.Billing.GetAccessStateTest do
  use OperatelyWeb.TurboCase

  import Operately.BlobsFixtures

  alias Operately.Access.Binding
  alias Operately.Billing
  alias Operately.Billing.Plans

  describe "security" do
    setup :enable_instance_billing

    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = query(ctx.conn, [:billing, :get_access_state], %{})
    end

    test "it allows a member with minimal company access", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_company_member(:member)
        |> Factory.set_company_access_level(:member, Binding.minimal_access())
        |> Factory.log_in_person(:member)

      assert {200, _res} = query(ctx.conn, [:billing, :get_access_state], %{})
    end

    test "it rejects a non-member", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_account(:outsider)
        |> Factory.log_in_account(:outsider)

      assert {404, _} = query(ctx.conn, [:billing, :get_access_state], %{})
    end

    test "it returns not found when billing is globally disabled", ctx do
      Application.put_env(:operately, :billing_enabled, false)

      ctx =
        ctx
        |> Factory.setup()
        |> Factory.log_in_person(:creator)

      assert {404, _} = query(ctx.conn, [:billing, :get_access_state], %{})
    end
  end

  describe "functionality" do
    setup :setup_member_ctx

    test "it returns a synthesized normal state when no billing row exists", ctx do
      blob_fixture(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id,
        status: :uploaded,
        size: 2_048
      })

      assert {200, res} = query(ctx.conn, [:billing, :get_access_state], %{})

      assert res.access_state.access_state == "normal"
      assert res.access_state.access_state_reason == nil
      assert res.access_state.access_state_started_at == nil
      assert res.access_state.access_state_ends_at == nil

      assert res.access_state.member_limit == %{
               blocked: false,
               code: "member_count_limit_exceeded",
               current_usage: 2,
               enforced: false,
               limit: 20,
               limit_key: "member_count",
               near_limit: false,
               plan_key: "free",
               projected_usage: 2,
               remaining: 18,
               requested_delta: 0
             }

      assert res.access_state.storage_limit == %{
               blocked: false,
               code: "storage_limit_exceeded",
               current_usage: 2048,
               enforced: false,
               limit: Plans.storage_limit_bytes(:free),
               limit_key: "storage_bytes",
               near_limit: false,
               plan_key: "free",
               projected_usage: 2048,
               remaining: Plans.storage_limit_bytes(:free) - 2048,
               requested_delta: 0
             }
    end

    test "it returns the local access-state projection and current plan snapshots", ctx do
      started_at = DateTime.utc_now() |> DateTime.truncate(:second)
      ends_at = DateTime.add(started_at, 14 * 24 * 60 * 60, :second)

      {:ok, _account} =
        Billing.create_billing_account(%{
          company_id: ctx.company.id,
          provider: "polar",
          plan_key: :team,
          billing_interval: :monthly,
          status: :past_due,
          access_state: :payment_grace,
          access_state_reason: :past_due,
          access_state_started_at: started_at,
          access_state_ends_at: ends_at
        })

      blob_fixture(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id,
        status: :uploaded,
        size: Plans.storage_limit_bytes(:team) - 1
      })

      assert {200, res} = query(ctx.conn, [:billing, :get_access_state], %{})

      assert res.access_state.access_state == "payment_grace"
      assert res.access_state.access_state_reason == "past_due"
      assert res.access_state.access_state_started_at == DateTime.to_iso8601(started_at)
      assert res.access_state.access_state_ends_at == DateTime.to_iso8601(ends_at)
      assert res.access_state.member_limit.plan_key == "team"
      assert res.access_state.member_limit.limit == 50
      assert res.access_state.member_limit.enforced == false
      assert res.access_state.storage_limit.plan_key == "team"
      assert res.access_state.storage_limit.limit == Plans.storage_limit_bytes(:team)
      assert res.access_state.storage_limit.enforced == false
    end

    test "it marks limit snapshots as enforced for flagged companies", ctx do
      ctx = Factory.enable_feature(ctx, "billing")

      assert {200, res} = query(ctx.conn, [:billing, :get_access_state], %{})

      assert res.access_state.member_limit.enforced == true
      assert res.access_state.storage_limit.enforced == true
    end
  end

  defp enable_instance_billing(_ctx) do
    Application.put_env(:operately, :billing_enabled, true)
    on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)
    :ok
  end

  defp setup_member_ctx(ctx) do
    enable_instance_billing(ctx)

    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:member)
      |> Factory.set_company_access_level(:member, Binding.minimal_access())
      |> Factory.log_in_person(:member)

    {:ok, ctx}
  end
end
