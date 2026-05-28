defmodule OperatelyWeb.Api.Companies.InviteGuestTest do
  use OperatelyWeb.TurboCase

  alias Operately.Billing
  alias Operately.People

  @invite_guest_input %{
    :full_name => "Guest User",
    :email => "guest@your-company.com",
    :title => "Advisor",
  }

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:companies, :invite_guest], %{})
    end

    test "member account without edit access cannot invite guests", ctx do
      ctx = register_and_log_in_account(ctx)

      assert {403, res} = mutation(ctx.conn, [:companies, :invite_guest], @invite_guest_input)

      assert res == %{:error => "Forbidden", :message => "You don't have permission to perform this action"}
    end
  end

  describe "invite_guest functionality" do
    setup :register_and_log_in_account
    setup :promote_to_owner

    test "creates invite link for new guest", ctx do
      assert {200, res} = mutation(ctx.conn, [:companies, :invite_guest], @invite_guest_input)

      assert res.new_account
      assert res.invite_link.token
      assert res.person_id

      person = People.get_person_by_email(ctx.company, @invite_guest_input[:email])
      assert person.type == :guest
      assert person.id == res.person_id
    end

    test "skips invite link when account already used", ctx do
      ctx = Factory.add_account(ctx, :account)
      {:ok, _} = People.mark_account_first_login(ctx.account)

      assert {200, res} = mutation(ctx.conn, [:companies, :invite_guest], %{
        full_name: @invite_guest_input.full_name,
        email: ctx.account.email,
        title: @invite_guest_input.title,
      })

      refute res.new_account
      refute res.invite_link
      assert res.person_id

      person = People.get_person_by_email(ctx.company, ctx.account.email)
      assert person.type == :guest
      assert person.id == res.person_id
    end

    test "email already taken", ctx do
      assert {200, _} = mutation(ctx.conn, [:companies, :invite_guest], @invite_guest_input)
      assert {400, res} = mutation(ctx.conn, [:companies, :invite_guest], @invite_guest_input)

      assert res == %{:error => "Bad request", :message => "Email has already been taken"}
    end

    test "returns a billing limit error when the company is already full", ctx do
      company = enable_billing(ctx.company)
      fill_company_to_member_limit(company)

      assert {400, res} = mutation(ctx.conn, [:companies, :invite_guest], @invite_guest_input)

      assert res == %{
               :error => "Bad request",
               :message => "This company has reached its member limit. Upgrade the plan to add more people."
             }

      refute People.get_person_by_email(company, @invite_guest_input[:email])
    end

    test "email can't be blank", ctx do
      input = put_in(@invite_guest_input, [:email], "")

      assert {400, res} = mutation(ctx.conn, [:companies, :invite_guest], input)
      assert res == %{:error => "Bad request", :message => "Email can't be blank"}
    end

    test "full_name can't be blank", ctx do
      input = put_in(@invite_guest_input, [:full_name], "")

      assert {400, res} = mutation(ctx.conn, [:companies, :invite_guest], input)
      assert res == %{:error => "Bad request", :message => "Name can't be blank"}
    end
  end

  defp promote_to_owner(ctx) do
    {:ok, _} = Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)
    ctx
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
          full_name: "Invite Guest Limit #{index}",
          email: "invite-guest-limit-#{index}@example.com"
        })
      end)
    end
  end
end
