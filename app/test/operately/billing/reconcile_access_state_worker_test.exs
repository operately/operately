defmodule Operately.Billing.ReconcileAccessStateWorkerTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures

  alias Operately.Billing
  alias Operately.Billing.ReconcileAccessStateWorker

  test "it promotes expired payment_grace rows to read_only" do
    company = company_fixture()
    deadline = DateTime.utc_now() |> DateTime.add(-60, :second) |> DateTime.truncate(:second)

    {:ok, account} =
      Billing.create_billing_account(%{
        company_id: company.id,
        provider: "polar",
        status: :past_due,
        access_state: :payment_grace,
        access_state_reason: :past_due,
        access_state_started_at: DateTime.add(deadline, -60, :second),
        access_state_ends_at: deadline
      })

    assert :ok = ReconcileAccessStateWorker.perform(%Oban.Job{args: %{}})

    account = Billing.get_billing_account!(account.id)

    assert account.access_state == :read_only
    assert account.access_state_reason == :past_due
    assert account.access_state_started_at == deadline
    assert account.access_state_ends_at == nil
  end

  test "it promotes expired over_limit_grace rows to read_only" do
    company = company_fixture()
    deadline = DateTime.utc_now() |> DateTime.add(-60, :second) |> DateTime.truncate(:second)

    {:ok, account} =
      Billing.create_billing_account(%{
        company_id: company.id,
        provider: "polar",
        status: :active,
        access_state: :over_limit_grace,
        access_state_reason: :over_limit_after_downgrade,
        access_state_started_at: DateTime.add(deadline, -60, :second),
        access_state_ends_at: deadline
      })

    assert :ok = ReconcileAccessStateWorker.perform(%Oban.Job{args: %{}})

    account = Billing.get_billing_account!(account.id)

    assert account.access_state == :read_only
    assert account.access_state_reason == :over_limit_after_downgrade
    assert account.access_state_started_at == deadline
    assert account.access_state_ends_at == nil
  end

  test "it leaves non-expired grace rows unchanged and ignores normal/read_only rows" do
    company = company_fixture()
    future_deadline = DateTime.add(DateTime.utc_now(), 60, :second)

    {:ok, payment_grace} =
      Billing.create_billing_account(%{
        company_id: company.id,
        provider: "polar",
        status: :past_due,
        access_state: :payment_grace,
        access_state_reason: :past_due,
        access_state_started_at: DateTime.utc_now(),
        access_state_ends_at: future_deadline
      })

    {:ok, normal_account} =
      Billing.create_billing_account(%{
        company_id: company_fixture().id,
        provider: "polar",
        status: :free
      })

    {:ok, read_only_account} =
      Billing.create_billing_account(%{
        company_id: company_fixture().id,
        provider: "polar",
        status: :active,
        access_state: :read_only,
        access_state_reason: :past_due,
        access_state_started_at: DateTime.utc_now()
      })

    assert :ok = ReconcileAccessStateWorker.perform(%Oban.Job{args: %{}})

    assert Billing.get_billing_account!(payment_grace.id).access_state == :payment_grace
    assert Billing.get_billing_account!(normal_account.id).access_state == :normal
    assert Billing.get_billing_account!(read_only_account.id).access_state == :read_only
  end
end
