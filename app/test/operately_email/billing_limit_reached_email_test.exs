defmodule OperatelyEmail.BillingLimitReachedEmailTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Swoosh.TestAssertions

  alias Operately.Billing.EnforceLimits.LimitStatus
  alias OperatelyEmail.Emails.BillingLimitReachedEmail

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id, full_name: "Admin Adminson"})
    owner = person_fixture_with_account(%{company_id: company.id, full_name: "Owner Ownerson"})

    {:ok, company: company, admin: admin, owner: owner}
  end

  test "sends a multi-recipient member-limit email with billing CTA", ctx do
    status = limit_status(:member_count, 20, 20)

    assert {:ok, _} = BillingLimitReachedEmail.send([ctx.admin, ctx.owner], ctx.company, status)

    assert_email_sent(fn email ->
      assert email.subject == "#{ctx.company.name} has reached its member limit"
      assert Enum.sort(Enum.map(email.to, &elem(&1, 1))) == Enum.sort([ctx.admin.email, ctx.owner.email])
      assert email.html_body =~ "member limit"
      assert email.html_body =~ "20"
      assert email.html_body =~ "Review Billing"
      assert email.text_body =~ OperatelyWeb.Paths.company_billing_path(ctx.company)
      true
    end)
  end

  defp limit_status(limit_key, current_usage, limit) do
    %LimitStatus{
      limit_key: limit_key,
      plan_key: :free,
      current_usage: current_usage,
      requested_delta: 0,
      projected_usage: current_usage,
      limit: limit,
      remaining: max(limit - current_usage, 0),
      near_limit: true,
      blocked: false,
      enforced: true,
      recommended_upgrade: nil
    }
  end
end
