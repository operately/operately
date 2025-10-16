defmodule OperatelyWeb.Api.Mutations.AddCompanyMemberTest do
  use OperatelyWeb.TurboCase

  alias Operately.People

  @add_company_member_input %{
    :full_name => "John Doe",
    :email => "john@your-company.com",
    :title => "Developer"
  }

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :add_company_member, %{})
    end

    test "member account without full access can't invite other members", ctx do
      ctx = register_and_log_in_account(ctx)

      assert {403, res} = mutation(ctx.conn, :add_company_member, @add_company_member_input)

      assert res == %{:error => "Forbidden", :message => "You don't have permission to perform this action"}
    end
  end

  describe "add_company_member functionality" do
    setup :register_and_log_in_account
    setup :promote_to_owner

    test "creates first-time-access token for new member", ctx do
      assert {200, res} = mutation(ctx.conn, :add_company_member, @add_company_member_input)

      assert res.invitation.token
    end

    test "email already taken", ctx do
      assert {200, _} = mutation(ctx.conn, :add_company_member, @add_company_member_input)
      assert {400, res} = mutation(ctx.conn, :add_company_member, @add_company_member_input)

      assert res == %{:error => "Bad request", :message => "Email has already been taken"}
    end

    test "email can't be blank", ctx do
      input = put_in(@add_company_member_input, [:email], "")

      assert {400, res} = mutation(ctx.conn, :add_company_member, input)
      assert res == %{:error => "Bad request", :message => "Email can't be blank"}
    end

    test "full_name can't be blank", ctx do
      input = put_in(@add_company_member_input, [:full_name], "")

      assert {400, res} = mutation(ctx.conn, :add_company_member, input)
      assert res == %{:error => "Bad request", :message => "Name can't be blank"}
    end

    test "email can be used to create one and only one account per company", ctx do
      other_ctx = register_and_log_in_account(ctx) |> promote_to_owner()

      assert {200, res} = mutation(ctx.conn, :add_company_member, @add_company_member_input)
      assert res.new_account
      assert res.invitation

      update_person_has_open_invitation(ctx)

      assert {200, res} = mutation(other_ctx.conn, :add_company_member, @add_company_member_input)
      refute res.new_account
      refute res.invitation

      assert {400, res} = mutation(ctx.conn, :add_company_member, @add_company_member_input)
      assert res == %{:error => "Bad request", :message => "Email has already been taken"}
      assert {400, res} = mutation(other_ctx.conn, :add_company_member, @add_company_member_input)
      assert res == %{:error => "Bad request", :message => "Email has already been taken"}
    end
  end

  defp promote_to_owner(ctx) do
    {:ok, _} = Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)
    ctx
  end

  defp update_person_has_open_invitation(ctx) do
    person = People.get_person_by_email(ctx.company, @add_company_member_input[:email])
    {:ok, _} = People.update_person(person, %{has_open_invitation: false})
  end
end
