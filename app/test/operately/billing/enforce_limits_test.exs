defmodule Operately.Billing.EnforceLimitsTest do
  use Operately.DataCase, async: true

  import Operately.BlobsFixtures
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Billing
  alias Operately.Billing.EnforceLimits
  alias Operately.Billing.EnforceLimits.LimitError
  alias Operately.Billing.EnforceLimits.LimitStatus
  alias Operately.Billing.Overview
  alias Operately.Billing.Plans

  setup do
    company = company_fixture()
    {:ok, company: company}
  end

  describe "status/3 and check/3" do
    test "falls back to the free plan when no billing row exists", ctx do
      company = enable_billing(ctx.company)
      create_active_product("team", "monthly")

      assert %LimitStatus{} = status = EnforceLimits.status(company, :member_count, current_usage: 0)

      assert status.plan_key == "free"
      assert status.limit_key == :member_count
      assert status.limit == 20
      assert status.current_usage == 0
      assert status.projected_usage == 0
      assert status.remaining == 20
      assert status.enforced == true
      assert status.blocked == false
      assert status.recommended_upgrade == %{plan_key: "team", billing_interval: :monthly, source: :next_plan}
    end

    test "uses the local paid projection for plan entitlements", ctx do
      company = enable_billing(ctx.company)
      create_active_product("business", "yearly")
      {:ok, _account} = Billing.sync_billing_account(company, %{provider: "polar", plan_key: "team", billing_interval: :yearly, status: :active})

      assert %LimitStatus{} = status = EnforceLimits.status(company, :member_count, current_usage: 10)

      assert status.plan_key == "team"
      assert status.limit == 50
      assert status.remaining == 40
      assert status.recommended_upgrade == %{plan_key: "business", billing_interval: :yearly, source: :next_plan}
    end

    test "returns unenforced pass-through status when billing is globally enabled but the company flag is off", ctx do
      Application.put_env(:operately, :billing_enabled, true)
      on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)
      create_active_product("team", "monthly")

      assert %LimitStatus{} = status = EnforceLimits.status(ctx.company, :member_count, current_usage: 20, requested_delta: 1)

      assert status.enforced == false
      assert status.blocked == false
      assert status.near_limit == false
      assert status.recommended_upgrade == nil

      assert :ok = EnforceLimits.check(ctx.company, :member_count, current_usage: 20, requested_delta: 1)
    end

    test "distinguishes allowed and blocked member additions", ctx do
      company = enable_billing(ctx.company)

      assert :ok = EnforceLimits.check(company, :member_count, current_usage: 19, requested_delta: 1)

      assert {:error, %LimitError{} = error} = EnforceLimits.check(company, :member_count, current_usage: 20, requested_delta: 1)

      assert error.code == :member_count_limit_exceeded
      assert error.plan_key == "free"
      assert error.current_usage == 20
      assert error.projected_usage == 21
      assert error.limit == 20
      assert EnforceLimits.public_message(error) ==
               "This company has reached its member limit: 20 of 20 active members. Adding or restoring people is blocked until this company is back within its plan limits."

      assert EnforceLimits.to_api_error(error) ==
               {:error, :bad_request,
                "This company has reached its member limit: 20 of 20 active members. Adding or restoring people is blocked until this company is back within its plan limits.",
                %{
                  blocked: true,
                  code: "member_count_limit_exceeded",
                  current_usage: 20,
                  enforced: true,
                  limit: 20,
                  limit_key: "member_count",
                  near_limit: true,
                  plan_key: "free",
                  projected_usage: 21,
                  recommended_upgrade: nil,
                  remaining: 0,
                  requested_delta: 1
                }}
    end

    test "formats storage-limit public messages with usage details", ctx do
      company = enable_billing(ctx.company)
      storage_limit = Plans.storage_limit_bytes(:free)

      assert {:error, %LimitError{} = error} =
               EnforceLimits.check(company, :storage_bytes, current_usage: storage_limit, requested_delta: 1)

      assert EnforceLimits.public_message(error) ==
               "This company has reached its storage limit: 1 GB of 1 GB used. Uploading files is blocked until this company is back within its plan limits."
    end

    test "formats storage-limit public messages for sub-kilobyte and petabyte values" do
      error = %LimitError{
        code: :storage_limit_exceeded,
        limit_key: :storage_bytes,
        plan_key: "free",
        current_usage: 512,
        requested_delta: 1,
        projected_usage: 513,
        limit: 1_125_899_906_842_624,
        remaining: 1_125_899_906_842_112,
        near_limit: false,
        blocked: true,
        enforced: true,
        recommended_upgrade: nil
      }

      assert EnforceLimits.public_message(error) ==
               "This company has reached its storage limit: 512 B of 1 PB used. Uploading files is blocked until this company is back within its plan limits."
    end

    test "marks usage as near the limit once it reaches ninety percent", ctx do
      company = enable_billing(ctx.company)

      refute EnforceLimits.status(company, :member_count, current_usage: 17).near_limit
      assert EnforceLimits.status(company, :member_count, current_usage: 18).near_limit
    end

    test "prefers the remembered suggested plan when it is a valid sellable upgrade", ctx do
      company = enable_billing(ctx.company)
      create_active_product("team", "monthly")
      create_active_product("team", "yearly")
      create_active_product("business", "monthly")

      {:ok, account} = Billing.get_or_create_billing_account(company)
      {:ok, _account} = Billing.remember_plan(account, :team, :yearly, "website")

      assert EnforceLimits.status(company, :member_count, current_usage: 0).recommended_upgrade ==
               %{plan_key: "team", billing_interval: :yearly, source: :suggested}
    end

    test "falls back to the next higher sellable plan when the suggestion is not an upgrade", ctx do
      company = enable_billing(ctx.company)
      create_active_product("business", "monthly")
      create_active_product("business", "yearly")
      {:ok, account} = Billing.sync_billing_account(company, %{provider: "polar", plan_key: "team", billing_interval: :monthly, status: :active})
      {:ok, _account} = Billing.remember_plan(account, :team, :yearly, "website")

      assert EnforceLimits.status(company, :member_count, current_usage: 0).recommended_upgrade ==
               %{plan_key: "business", billing_interval: :monthly, source: :next_plan}
    end

    test "returns no recommendation when the company is already on the highest plan", ctx do
      company = enable_billing(ctx.company)
      {:ok, _account} = Billing.sync_billing_account(company, %{provider: "polar", plan_key: "business", billing_interval: :monthly, status: :active})

      assert EnforceLimits.status(company, :member_count, current_usage: 0).recommended_upgrade == nil
    end
  end

  describe "billing-owned active member count" do
    test "excludes suspended people from the billing overview count", ctx do
      {:ok, account} = Billing.get_or_create_billing_account(ctx.company)
      person_fixture_with_account(%{
        company_id: ctx.company.id,
        suspended: true,
        suspended_at: DateTime.utc_now() |> DateTime.truncate(:second)
      })

      overview = Overview.build(ctx.company, account, [])

      assert overview.member_count == 1
      assert Billing.active_member_count(ctx.company) == 1
    end

    test "includes active guests in the billing overview count", ctx do
      {:ok, account} = Billing.get_or_create_billing_account(ctx.company)
      person_fixture_with_account(%{company_id: ctx.company.id, type: :guest})

      overview = Overview.build(ctx.company, account, [])

      assert overview.member_count == 2
      assert Billing.active_member_count(ctx.company) == 2
    end
  end

  describe "billing-owned storage usage" do
    test "sums uploaded company blobs and ignores pending ones", ctx do
      {:ok, account} = Billing.get_or_create_billing_account(ctx.company)
      author = person_fixture_with_account(%{company_id: ctx.company.id})
      blob_fixture(%{company_id: ctx.company.id, author_id: author.id, status: :uploaded, size: 1024})
      blob_fixture(%{company_id: ctx.company.id, author_id: author.id, status: :uploaded, size: 2048})
      blob_fixture(%{company_id: ctx.company.id, author_id: author.id, status: :pending, size: 4096})

      overview = Overview.build(ctx.company, account, [])

      assert overview.storage_usage_bytes == 3072
      assert Billing.company_storage_bytes(ctx.company) == 3072
    end

    test "blocks free companies at the storage limit and allows paid companies beyond the free limit", ctx do
      free_company = enable_billing(ctx.company)
      free_author = person_fixture_with_account(%{company_id: free_company.id})
      blob_fixture(%{
        company_id: free_company.id,
        author_id: free_author.id,
        status: :uploaded,
        size: Plans.storage_limit_bytes(:free)
      })

      assert {:error, %LimitError{code: :storage_limit_exceeded}} = Billing.check_storage_limit(free_company, 1)

      paid_company = company_fixture()
      paid_company = enable_billing(paid_company)
      {:ok, _account} = Billing.sync_billing_account(paid_company, %{provider: "polar", plan_key: "team", billing_interval: :monthly, status: :active})
      paid_author = person_fixture_with_account(%{company_id: paid_company.id})

      blob_fixture(%{
        company_id: paid_company.id,
        author_id: paid_author.id,
        status: :uploaded,
        size: Plans.storage_limit_bytes(:free)
      })

      assert :ok = Billing.check_storage_limit(paid_company, 1)
    end
  end

  defp enable_billing(company) do
    Application.put_env(:operately, :billing_enabled, true)
    on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

    {:ok, company} = Operately.Companies.enable_experimental_feature(company, "billing")
    company
  end

  defp create_active_product(plan_family, billing_interval) do
    Billing.create_product(%{
      provider: "polar",
      plan_family: plan_family,
      billing_interval: billing_interval,
      polar_product_id: "prod_#{plan_family}_#{billing_interval}",
      active: true
    })
  end
end
