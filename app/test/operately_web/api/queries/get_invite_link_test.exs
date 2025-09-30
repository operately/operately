defmodule OperatelyWeb.Api.Queries.GetInviteLinkTest do
  use OperatelyWeb.TurboCase

  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
  end

  describe "get_invite_link functionality" do
    test "returns the invite link with valid token", ctx do
      {:ok, invite_link} = Operately.InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      })

      invite_link = invite_link |> Operately.Repo.preload([:author, :company])

      assert {200, res} = query(ctx.conn, :get_invite_link, %{"token" => invite_link.token})

      assert res.invite_link.id == invite_link.id
      assert res.invite_link.token == invite_link.token
      assert res.invite_link.author.id == ctx.creator.id
      assert res.invite_link.company.id == ctx.company.id
      assert res.invite_link.is_active == true
    end

    test "returns nil for invalid token", ctx do
      assert {200, res} = query(ctx.conn, :get_invite_link, %{"token" => "invalid-token"})
      assert res.invite_link == nil
    end

    test "works without authentication", _ctx do
      # Create a link first
      account = Operately.PeopleFixtures.account_fixture()
      company = Operately.CompaniesFixtures.company_fixture()
      creator = Operately.PeopleFixtures.person_fixture(%{account_id: account.id, company_id: company.id})

      {:ok, invite_link} = Operately.InviteLinks.create_invite_link(%{
        company_id: company.id,
        author_id: creator.id
      })

      # Test without authentication
      conn = build_conn()
      assert {200, res} = query(conn, :get_invite_link, %{"token" => invite_link.token})
      assert res.invite_link.id == invite_link.id
    end
  end
end