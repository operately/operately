defmodule OperatelyWeb.Api.Mutations.CreateInviteLinkTest do
  use OperatelyWeb.TurboCase

  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
  end

  describe "create_invite_link functionality" do
    test "creates invite link with valid data", ctx do
      assert {200, res} = mutation(ctx.conn, :create_invite_link, %{
        "company_id" => Paths.company_id(ctx.company)
      })

      assert res.invite_link != nil
      assert res.invite_link.company_id == ctx.company.id
      assert res.invite_link.is_active == true
      assert res.invite_link.use_count == 0
      assert res.invite_link.token != nil
      assert String.length(res.invite_link.token) >= 32
    end

    test "requires authentication", _ctx do
      conn = build_conn()
      company = Operately.CompaniesFixtures.company_fixture()

      assert {401, _res} = mutation(conn, :create_invite_link, %{
        "company_id" => Paths.company_id(company)
      })
    end

    test "requires company membership", ctx do
      # Create another company
      other_company = Operately.CompaniesFixtures.company_fixture()

      assert {404, _res} = mutation(ctx.conn, :create_invite_link, %{
        "company_id" => Paths.company_id(other_company)
      })
    end

    test "requires invite permission", ctx do
      # Create a regular member without admin permissions
      ctx = Factory.add_company_member(ctx, :member)
      member_conn = log_in_account(ctx.member.account)

      # This should fail because member doesn't have invite permissions
      assert {403, _res} = mutation(member_conn, :create_invite_link, %{
        "company_id" => Paths.company_id(ctx.company)
      })
    end
  end
end