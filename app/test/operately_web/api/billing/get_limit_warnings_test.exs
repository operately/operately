defmodule OperatelyWeb.Api.Billing.GetLimitWarningsTest do
  use OperatelyWeb.TurboCase

  import Operately.BlobsFixtures

  alias Operately.Access.Binding
  alias Operately.Billing
  alias Operately.Billing.Plans

  describe "security" do
    setup :enable_instance_billing

    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = query(ctx.conn, [:billing, :get_limit_warnings], %{})
    end

    test "it allows a company owner", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.enable_feature("billing")
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:billing, :get_limit_warnings], %{})
      assert res.warnings.member_limit.limit_key == "member_count"
      assert res.warnings.storage_limit.limit_key == "storage_bytes"
    end

    test "it allows a company admin", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.enable_feature("billing")
        |> Factory.add_company_admin(:admin)
        |> Factory.log_in_person(:admin)

      assert {200, _} = query(ctx.conn, [:billing, :get_limit_warnings], %{})
    end

    test "it rejects regular members", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.enable_feature("billing")
        |> Factory.add_company_member(:member)
        |> Factory.set_company_access_level(:member, Binding.edit_access())
        |> Factory.log_in_person(:member)

      assert {403, _} = query(ctx.conn, [:billing, :get_limit_warnings], %{})
    end

    test "it returns not found when billing is disabled for the company", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.log_in_person(:creator)

      assert {404, _} = query(ctx.conn, [:billing, :get_limit_warnings], %{})
    end
  end

  describe "functionality" do
    setup :setup_owner_ctx

    test "it returns near-limit member and storage warning details", ctx do
      create_active_product("team", "monthly")

      ctx =
        Enum.reduce(1..17, ctx, fn index, acc ->
          Factory.add_company_member(acc, :"near_limit_member_#{index}", name: "Near Limit Member #{index}")
        end)

      blob_fixture(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id,
        status: :uploaded,
        size: trunc(Plans.storage_limit_bytes(:free) * 0.95)
      })

      assert {200, res} = query(ctx.conn, [:billing, :get_limit_warnings], %{})

      assert res.warnings.member_limit == %{
               blocked: false,
               code: "member_count_limit_exceeded",
               current_usage: 18,
               enforced: true,
               limit: 20,
               limit_key: "member_count",
               near_limit: true,
               plan_key: "free",
               projected_usage: 18,
               recommended_upgrade: %{
                 billing_interval: "monthly",
                 plan_key: "team",
                 source: "next_plan"
               },
               remaining: 2,
               requested_delta: 0
             }

      assert res.warnings.storage_limit == %{
               blocked: false,
               code: "storage_limit_exceeded",
               current_usage: trunc(Plans.storage_limit_bytes(:free) * 0.95),
               enforced: true,
               limit: Plans.storage_limit_bytes(:free),
               limit_key: "storage_bytes",
               near_limit: true,
               plan_key: "free",
               projected_usage: trunc(Plans.storage_limit_bytes(:free) * 0.95),
               recommended_upgrade: %{
                 billing_interval: "monthly",
                 plan_key: "team",
                 source: "next_plan"
               },
               remaining: Plans.storage_limit_bytes(:free) - trunc(Plans.storage_limit_bytes(:free) * 0.95),
               requested_delta: 0
             }
    end
  end

  defp enable_instance_billing(_ctx) do
    Application.put_env(:operately, :billing_enabled, true)
    on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)
    :ok
  end

  defp setup_owner_ctx(ctx) do
    enable_instance_billing(ctx)

    ctx =
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("billing")
      |> Factory.log_in_person(:creator)

    {:ok, ctx}
  end

  defp create_active_product(plan_family, billing_interval) do
    Billing.create_product(%{
      provider: "polar",
      plan_family: plan_family,
      billing_interval: billing_interval,
      polar_product_id: "warning-#{plan_family}-#{billing_interval}",
      active: true
    })
  end
end
