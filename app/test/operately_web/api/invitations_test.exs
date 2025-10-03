defmodule OperatelyWeb.Api.InvitationsTest do
  use OperatelyWeb.TurboCase

  alias Operately.InviteLinks
  alias Operately.Repo

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "get_invite_link" do
    test "returns nil when token is unknown", ctx do
      assert {200, %{invite_link: nil}} = query(ctx.conn, [:invitations, :get_invite_link], %{token: "missing-token"})
    end

    test "returns serialized invite link when token matches", ctx do
      invite_link = create_invite_link(ctx)

      assert {200, %{invite_link: res}} = query(ctx.conn, [:invitations, :get_invite_link], %{token: invite_link.token})
      assert res == Serializer.serialize(invite_link, level: :full)
    end
  end

  describe "list_invite_links" do
    test "requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:invitations, :list_invite_links], %{company_id: ctx.company.id})
    end

    test "requires company_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:invitations, :list_invite_links], %{})
      assert res.message.message == "Missing required fields: company_id"
    end

    test "returns not found when company is inaccessible", ctx do
      ctx = ctx |> Factory.add_company(:other_company, ctx.account) |> Factory.log_in_person(:creator)

      params = %{company_id: ctx.other_company.id}

      assert {404, _} = query(ctx.conn, [:invitations, :list_invite_links], params)
    end

    test "returns invite links for the company", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      invite_link = create_invite_link(ctx)

      assert {200, %{invite_links: links}} = query(ctx.conn, [:invitations, :list_invite_links], %{company_id: ctx.company.id})

      assert links == [Serializer.serialize(invite_link, level: :essential)]
    end
  end

  describe "create_invite_link" do
    test "requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:invitations, :create_invite_link], %{})
    end

    test "returns forbidden when person lacks permission", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {403, %{message: message}} = mutation(ctx.conn, [:invitations, :create_invite_link], %{})

      assert message == "You don't have permission to perform this action"
    end

    test "creates and returns invite link for authorized person", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      assert {200, %{invite_link: res}} = mutation(ctx.conn, [:invitations, :create_invite_link], %{})

      {:ok, stored} = InviteLinks.get_invite_link_by_token(res.token)
      assert res == Serializer.serialize(stored, level: :full)
    end
  end

  describe "join_company_via_invite_link" do
    setup ctx do
      ctx
      |> Factory.add_account(:new_account)
      |> Factory.log_in_account(:new_account)
    end

    def execute(ctx, params) do
      mutation(ctx.conn, [:invitations, :join_company_via_invite_link], params)
    end

    test "returns error when token is unknown", ctx do
      assert {400, res} = execute(ctx, %{token: "bad-token"})
      assert res.message == "Invalid invite link"
    end

    test "returns error when invite link is inactive", ctx do
      invite_link = create_invite_link(ctx)
      {:ok, inactive} = InviteLinks.revoke_invite_link(invite_link)

      assert {400, res} = execute(ctx, %{token: inactive.token})
      assert res.message == "This invite link is no longer valid"
    end

    test "returns error when invite link is expired", ctx do
      invite_link = create_invite_link(ctx)
      expired_at = DateTime.add(DateTime.utc_now(), -60, :second)
      {:ok, expired} = InviteLinks.update_invite_link(invite_link, %{expires_at: expired_at})

      assert {400, res} = execute(ctx, %{token: expired.token})
      assert res.message == "This invite link has expired"
    end

    test "return company and person when successful", ctx do
      invite_link = create_invite_link(ctx)

      assert {200, res} = execute(ctx, %{token: invite_link.token})
      assert res.company == Serializer.serialize(ctx.company, level: :essential)
    end

    test "return company and person when already in company", ctx do
      ctx = Factory.add_company_member(ctx, :new_account)

      members = Operately.People.list_people(ctx.company.id)
      assert Enum.find(members, fn m -> m.account_id == ctx.new_account.id end)

      invite_link = create_invite_link(ctx)
      assert {200, res} = execute(ctx, %{token: invite_link.token})

      assert res.company == Serializer.serialize(ctx.company, level: :essential)
    end
  end

  describe "revoke_invite_link" do
    test "requires authentication", ctx do
      invite_link = create_invite_link(ctx)

      assert {401, _} =
               mutation(ctx.conn, [:invitations, :revoke_invite_link], %{
                 invite_link_id: invite_link.id
               })
    end

    test "requires invite_link_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} =
               mutation(ctx.conn, [:invitations, :revoke_invite_link], %{})

      assert res.message.message == "Missing required fields: invite_link_id"
    end

    test "returns forbidden when person lacks permission", ctx do
      invite_link = create_invite_link(ctx)

      ctx =
        ctx
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {403, %{message: message}} =
               mutation(ctx.conn, [:invitations, :revoke_invite_link], %{
                 invite_link_id: invite_link.id
               })

      assert message == "You don't have permission to perform this action"
    end

    test "revokes invite link for authorized person", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      invite_link = create_invite_link(ctx)

      assert {200, %{invite_link: res}} =
               mutation(ctx.conn, [:invitations, :revoke_invite_link], %{
                 invite_link_id: invite_link.id
               })

      assert res.is_active == false

      {:ok, stored} = InviteLinks.get_invite_link_by_token(res.token)
      assert stored.is_active == false
      assert res == Serializer.serialize(stored, level: :full)
    end
  end

  defp create_invite_link(ctx, attrs \\ %{}) do
    defaults = %{company_id: ctx.company.id, author_id: ctx.creator.id}
    {:ok, invite_link} = InviteLinks.create_invite_link(Map.merge(defaults, attrs))
    Repo.preload(invite_link, [:author, :company])
  end
end
