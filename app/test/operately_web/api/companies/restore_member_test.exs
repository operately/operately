defmodule OperatelyWeb.Api.Companies.RestoreMemberTest do
  use OperatelyWeb.TurboCase

  alias Operately.Billing

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_owner(:owner)
    |> Factory.add_company_admin(:admin)
    |> Factory.add_company_member(:member)
    |> Factory.add_company_member(:person)
    |> Factory.suspend_company_member(:person)
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:companies, :restore_member], %{})
    end
  end

  describe "permissions" do
    test "company members can't restore people", ctx do
      ctx = Factory.log_in_person(ctx, :member)
      assert {403, _} = request(ctx, ctx.person)
    end

    test "company admins can restore people", ctx do
      ctx = Factory.log_in_person(ctx, :admin)
      assert {200, _} = request(ctx, ctx.person)
    end

    test "company owners can restore people", ctx do
      ctx = Factory.log_in_person(ctx, :owner)
      assert {200, _} = request(ctx, ctx.person)
    end

    test "can't restore people from other companies", ctx do
      ctx2 = Factory.setup(%{})
      ctx2 = Factory.add_company_owner(ctx2, :person_from_other_company)

      ctx = Factory.log_in_person(ctx, :admin)
      assert {404, _} = request(ctx, ctx2.person_from_other_company)
    end
  end

  describe "functionality" do
    test "it restores a suspended person", ctx do
      person = Operately.Repo.reload(ctx.person)
      refute person.suspended_at == nil
      refute person.suspended == false

      ctx = Factory.log_in_person(ctx, :admin)
      assert {200, _} = request(ctx, ctx.person)

      person = Operately.Repo.reload(ctx.person)
      assert person.suspended_at == nil
      assert person.suspended == false
    end

    test "it returns a billing limit error when restoring would exceed the member limit", ctx do
      company = enable_billing(ctx.company)
      fill_company_to_member_limit(company)

      ctx = Factory.log_in_person(ctx, :admin)

      assert {400, res} = request(ctx, ctx.person)

      assert res.message == "This company has reached its member limit. Upgrade the plan to add more people."
      assert res.details.code == "member_count_limit_exceeded"
      assert res.details.limit_key == "member_count"
      assert res.details.plan_key == "free"

      person = Operately.Repo.reload(ctx.person)
      assert person.suspended
      assert person.suspended_at != nil
    end
  end

  defp request(ctx, person) do
    mutation(ctx.conn, [:companies, :restore_member], %{
      person_id: Paths.person_id(person)
    })
  end

  defp enable_billing(company) do
    Application.put_env(:operately, :billing_enabled, true)
    on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

    {:ok, company} = Operately.Companies.enable_experimental_feature(company, "billing")
    company
  end

  defp fill_company_to_member_limit(company) do
    needed_people = max(20 - Billing.active_member_count(company), 0)

    if needed_people > 0 do
      Enum.each(1..needed_people, fn index ->
        Operately.PeopleFixtures.person_fixture_with_account(%{
          company_id: company.id,
          full_name: "Restore Member Limit #{index}",
          email: "restore-member-limit-#{index}@example.com"
        })
      end)
    end
  end
end
