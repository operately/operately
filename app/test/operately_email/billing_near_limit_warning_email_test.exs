defmodule OperatelyEmail.BillingNearLimitWarningEmailTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Swoosh.TestAssertions

  alias Operately.Billing.NearLimitAlerting
  alias OperatelyEmail.Emails.BillingNearLimitWarningEmail

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id, full_name: "Admin Adminson"})
    owner = person_fixture_with_account(%{company_id: company.id, full_name: "Owner Ownerson"})

    {:ok, company: company, admin: admin, owner: owner}
  end

  test "sends a multi-recipient member near-limit email with billing CTA", ctx do
    status = NearLimitAlerting.snapshot(:member_count, 18, 20)

    assert {:ok, _} = BillingNearLimitWarningEmail.send([ctx.admin, ctx.owner], ctx.company, status)

    assert_email_sent(fn email ->
      assert email.subject == "#{ctx.company.name} has reached 90% of its free-plan member limit"
      assert Enum.sort(Enum.map(email.to, &elem(&1, 1))) == Enum.sort([ctx.admin.email, ctx.owner.email])
      assert email.html_body =~ "free-plan member limit"
      assert email.html_body =~ "18"
      assert email.html_body =~ "Review Billing"
      assert email.text_body =~ OperatelyWeb.Paths.company_billing_path(ctx.company)
      true
    end)
  end

  test "sends a storage near-limit email", ctx do
    status = NearLimitAlerting.snapshot(:storage_bytes, 966_367_642, 1_073_741_824)

    assert {:ok, _} = BillingNearLimitWarningEmail.send([ctx.admin, ctx.owner], ctx.company, status)

    assert_email_sent(fn email ->
      assert email.subject == "#{ctx.company.name} has reached 90% of its free-plan storage limit"
      assert email.html_body =~ "free-plan storage limit"
      assert email.html_body =~ "Review Billing"
      assert email.text_body =~ OperatelyWeb.Paths.company_billing_path(ctx.company)
      true
    end)
  end
end
