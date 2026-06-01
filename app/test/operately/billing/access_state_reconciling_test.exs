defmodule Operately.Billing.AccessStateReconcilingTest do
  use Operately.DataCase, async: true

  import Operately.BlobsFixtures
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Billing
  alias Operately.Billing.Plans

  @grace_period_seconds 14 * 24 * 60 * 60

  describe "sync_billing_account/2 access-state reconciliation" do
    test "first past_due sync starts payment_grace" do
      company = company_fixture()

      assert {:ok, account} =
               Billing.sync_billing_account(company, %{
                 provider: "polar",
                 plan_key: :team,
                 billing_interval: :monthly,
                 status: :past_due
               })

      assert account.access_state == :payment_grace
      assert account.access_state_reason == :past_due
      assert DateTime.diff(account.access_state_ends_at, account.access_state_started_at, :second) == @grace_period_seconds
    end

    test "repeated past_due sync preserves the original deadline" do
      company = company_fixture()

      {:ok, first_account} =
        Billing.sync_billing_account(company, %{
          provider: "polar",
          plan_key: :team,
          billing_interval: :monthly,
          status: :past_due
        })

      assert {:ok, second_account} =
               Billing.sync_billing_account(company, %{
                 provider: "polar",
                 plan_key: :team,
                 billing_interval: :monthly,
                 status: :past_due
               })

      assert second_account.access_state == :payment_grace
      assert second_account.access_state_reason == :past_due
      assert second_account.access_state_started_at == first_account.access_state_started_at
      assert second_account.access_state_ends_at == first_account.access_state_ends_at
    end

    test "recovery from past_due clears the access state" do
      company = company_fixture()

      {:ok, _account} =
        Billing.sync_billing_account(company, %{
          provider: "polar",
          plan_key: :team,
          billing_interval: :monthly,
          status: :past_due
        })

      assert {:ok, account} =
               Billing.sync_billing_account(company, %{
                 provider: "polar",
                 plan_key: :team,
                 billing_interval: :monthly,
                 status: :active
               })

      assert account.access_state == :normal
      assert account.access_state_reason == nil
      assert account.access_state_started_at == nil
      assert account.access_state_ends_at == nil
    end

    test "scheduled downgrade becoming current while over the member limit starts over_limit_grace" do
      company = company_fixture()
      add_members(company, 59)

      {:ok, _account} =
        Billing.create_billing_account(%{
          company_id: company.id,
          provider: "polar",
          plan_key: :business,
          billing_interval: :monthly,
          status: :active,
          scheduled_plan_key: :team,
          scheduled_billing_interval: :monthly,
          scheduled_change_effective_at: DateTime.utc_now()
        })

      assert {:ok, account} =
               Billing.sync_billing_account(company, %{
                 provider: "polar",
                 plan_key: :team,
                 billing_interval: :monthly,
                 status: :active,
                 scheduled_plan_key: nil,
                 scheduled_billing_interval: nil,
                 scheduled_change_effective_at: nil
               })

      assert_over_limit_grace(account)
    end

    test "scheduled downgrade becoming current while over the storage limit starts over_limit_grace" do
      company = company_fixture()
      author = person_fixture_with_account(%{company_id: company.id})

      blob_fixture(%{
        company_id: company.id,
        author_id: author.id,
        status: :uploaded,
        size: Plans.storage_limit_bytes(:team) + 1
      })

      {:ok, _account} =
        Billing.create_billing_account(%{
          company_id: company.id,
          provider: "polar",
          plan_key: :business,
          billing_interval: :monthly,
          status: :active,
          scheduled_plan_key: :team,
          scheduled_billing_interval: :monthly,
          scheduled_change_effective_at: DateTime.utc_now()
        })

      assert {:ok, account} =
               Billing.sync_billing_account(company, %{
                 provider: "polar",
                 plan_key: :team,
                 billing_interval: :monthly,
                 status: :active,
                 scheduled_plan_key: nil,
                 scheduled_billing_interval: nil,
                 scheduled_change_effective_at: nil
               })

      assert_over_limit_grace(account)
    end

    test "scheduled downgrade becoming current within the new limits does not start remediation" do
      company = company_fixture()

      {:ok, _account} =
        Billing.create_billing_account(%{
          company_id: company.id,
          provider: "polar",
          plan_key: :business,
          billing_interval: :monthly,
          status: :active,
          scheduled_plan_key: :team,
          scheduled_billing_interval: :monthly,
          scheduled_change_effective_at: DateTime.utc_now()
        })

      assert {:ok, account} =
               Billing.sync_billing_account(company, %{
                 provider: "polar",
                 plan_key: :team,
                 billing_interval: :monthly,
                 status: :active,
                 scheduled_plan_key: nil,
                 scheduled_billing_interval: nil,
                 scheduled_change_effective_at: nil
               })

      assert account.access_state == :normal
    end

    test "cancellation falling back to free while over the free plan limit starts over_limit_grace" do
      company = company_fixture()
      add_members(company, 20)

      {:ok, _account} =
        Billing.create_billing_account(%{
          company_id: company.id,
          provider: "polar",
          plan_key: :team,
          billing_interval: :monthly,
          status: :active,
          cancel_at_period_end: true,
          current_period_end: DateTime.utc_now()
        })

      assert {:ok, account} =
               Billing.sync_billing_account(company, %{
                 provider: "polar",
                 plan_key: nil,
                 billing_interval: nil,
                 status: :free,
                 cancel_at_period_end: false,
                 current_period_end: nil
               })

      assert_over_limit_grace(account)
    end

    test "an upgrade clears existing over_limit_grace state" do
      company = company_fixture()
      add_members(company, 59)

      {:ok, _account} =
        Billing.create_billing_account(%{
          company_id: company.id,
          provider: "polar",
          plan_key: :team,
          billing_interval: :monthly,
          status: :active,
          access_state: :over_limit_grace,
          access_state_reason: :over_limit_after_downgrade,
          access_state_started_at: DateTime.utc_now(),
          access_state_ends_at: DateTime.add(DateTime.utc_now(), 1_000, :second)
        })

      assert {:ok, account} =
               Billing.sync_billing_account(company, %{
                 provider: "polar",
                 plan_key: :business,
                 billing_interval: :monthly,
                 status: :active
               })

      assert account.access_state == :normal
      assert account.access_state_reason == nil
    end

    test "an expired payment grace seen during sync promotes immediately to read_only" do
      company = company_fixture()
      expired_deadline = DateTime.utc_now() |> DateTime.add(-60, :second) |> DateTime.truncate(:second)

      {:ok, _account} =
        Billing.create_billing_account(%{
          company_id: company.id,
          provider: "polar",
          plan_key: :team,
          billing_interval: :monthly,
          status: :past_due,
          access_state: :payment_grace,
          access_state_reason: :past_due,
          access_state_started_at: DateTime.add(expired_deadline, -@grace_period_seconds, :second),
          access_state_ends_at: expired_deadline
        })

      assert {:ok, account} =
               Billing.sync_billing_account(company, %{
                 provider: "polar",
                 plan_key: :team,
                 billing_interval: :monthly,
                 status: :past_due
               })

      assert account.access_state == :read_only
      assert account.access_state_reason == :past_due
      assert account.access_state_started_at == expired_deadline
      assert account.access_state_ends_at == nil
    end

    test "payment-default reason wins when both danger reasons could apply" do
      company = company_fixture()
      add_members(company, 59)

      {:ok, _account} =
        Billing.create_billing_account(%{
          company_id: company.id,
          provider: "polar",
          plan_key: :business,
          billing_interval: :monthly,
          status: :active,
          scheduled_plan_key: :team,
          scheduled_billing_interval: :monthly,
          scheduled_change_effective_at: DateTime.utc_now()
        })

      assert {:ok, account} =
               Billing.sync_billing_account(company, %{
                 provider: "polar",
                 plan_key: :team,
                 billing_interval: :monthly,
                 status: :past_due,
                 scheduled_plan_key: nil,
                 scheduled_billing_interval: nil,
                 scheduled_change_effective_at: nil
               })

      assert account.access_state == :payment_grace
      assert account.access_state_reason == :past_due
    end
  end

  defp add_members(company, count) do
    Enum.each(1..count, fn index ->
      person_fixture_with_account(%{
        company_id: company.id,
        full_name: "Billing Member #{index}",
        email: "billing-member-#{company.id}-#{index}@example.com"
      })
    end)
  end

  defp assert_over_limit_grace(account) do
    assert account.access_state == :over_limit_grace
    assert account.access_state_reason == :over_limit_after_downgrade
    assert DateTime.diff(account.access_state_ends_at, account.access_state_started_at, :second) == @grace_period_seconds
  end
end
