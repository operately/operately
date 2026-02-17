defmodule OperatelyWeb.Api.InvitationsTest do
  use OperatelyWeb.TurboCase

  alias Operately.InviteLinks
  alias Operately.Repo

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "get_invite_link_by_token" do
    test "returns nil when token is unknown", ctx do
      assert {200, %{invite_link: nil}} = query(ctx.conn, [:invitations, :get_invite_link_by_token], %{token: "missing-token"})
    end

    test "returns serialized invite link when token matches", ctx do
      invite_link = create_invite_link(ctx)

      assert {200, %{invite_link: res}} = query(ctx.conn, [:invitations, :get_invite_link_by_token], %{token: invite_link.token})
      assert res == Serializer.serialize(invite_link, level: :full)
    end
  end

  describe "get_company_invite_link" do
    test "requires authentication", ctx do
      assert {401, _} = execute(ctx)
    end

    test "returns forbidden when person lacks permission", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {404, %{message: message}} = execute(ctx)

      assert message == "The requested resource was not found"
    end

    test "if no active invite link exists, creates a new one", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      assert {200, %{invite_link: res}} = execute(ctx)

      {:ok, stored} = InviteLinks.get_invite_link_by_token(res.token)
      assert res == Serializer.serialize(stored, level: :full)
    end

    test "if an active invite link exists, returns the existing one", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      existing = create_invite_link(ctx)

      assert {200, %{invite_link: res}} = execute(ctx)
      assert res == Serializer.serialize(existing, level: :full)

      # did not create a new invite link
      invite_link_count = Repo.aggregate(InviteLinks.InviteLink, :count, :id)
      assert invite_link_count == 1
    end

    def execute(ctx) do
      mutation(ctx.conn, [:invitations, :get_company_invite_link], %{})
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

    test "return company and person when successful", ctx do
      invite_link = create_invite_link(ctx)

      assert {200, res} = execute(ctx, %{token: invite_link.token})
      assert res.company == Serializer.serialize(ctx.company, level: :essential)
    end

    test "return company and person when already in company", ctx do
      ctx = Factory.add_company_member(ctx, :member, account: :new_account)

      members = Operately.People.list_people(ctx.company.id)
      assert Enum.find(members, fn m -> m.account_id == ctx.new_account.id end)

      invite_link = create_invite_link(ctx)
      assert {200, res} = execute(ctx, %{token: invite_link.token})

      assert res.company == Serializer.serialize(ctx.company, level: :essential)
    end
  end

  describe "update_invite_link" do
    test "requires authentication", ctx do
      assert {401, _} = update_invite_link(ctx, %{})
    end

    test "toggle the invite link active status", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      invite_link = create_invite_link(ctx)

      # deactivate
      assert {200, _res} = update_invite_link(ctx, %{is_active: false})
      invite_link = Operately.Repo.reload(invite_link)
      refute invite_link.is_active

      # activate
      assert {200, _res} = update_invite_link(ctx, %{is_active: true})
      invite_link = Operately.Repo.reload(invite_link)
      assert invite_link.is_active
    end

    test "update the allowed domains", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      invite_link = create_invite_link(ctx)

      assert {200, _res} = update_invite_link(ctx, %{allowed_domains: ["example.com", "test.com"]})
      invite_link = Operately.Repo.reload(invite_link)
      assert invite_link.allowed_domains == ["example.com", "test.com"]

      assert {200, _res} = update_invite_link(ctx, %{allowed_domains: []})
      invite_link = Operately.Repo.reload(invite_link)
      assert invite_link.allowed_domains == []
    end

    def update_invite_link(ctx, params) do
      mutation(ctx.conn, [:invitations, :update_company_invite_link], params)
    end
  end

  describe "reset_company_invite_link" do
    test "requires authentication", ctx do
      assert {401, _} = reset_invite_link(ctx)
    end

    test "returns forbidden when person lacks permission", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      create_invite_link(ctx)

      assert {403, %{message: message}} = reset_invite_link(ctx)
      assert message == "You don't have permission to perform this action"
    end

    test "returns 404 when no invite link exists", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = reset_invite_link(ctx)
    end

    test "generates a new token for the invite link", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      invite_link = create_invite_link(ctx)
      original_token = invite_link.token

      assert {200, %{invite_link: res}} = reset_invite_link(ctx)

      # token should be different
      assert res.token != original_token

      # link should still be active
      assert res.is_active

      # verify in database
      {:ok, stored} = InviteLinks.get_invite_link(ctx.company.id)
      assert stored.token == res.token
      assert stored.token != original_token
      assert stored.is_active
    end

    test "preserves other invite link properties", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      original = create_invite_link(ctx, %{allowed_domains: ["example.com", "test.com"]})

      assert {200, %{invite_link: res}} = reset_invite_link(ctx)

      # properties should be preserved
      assert res.allowed_domains == ["example.com", "test.com"]
      assert res.company_id == ctx.company.id
      assert res.author == Serializer.serialize(original.author, level: :essential)
    end

    test "does not create a new invite link record", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      invite_link = create_invite_link(ctx)
      original_id = invite_link.id

      assert {200, %{invite_link: res}} = reset_invite_link(ctx)

      # should be the same record
      assert res.id == original_id

      # should still be only one invite link
      invite_link_count = Repo.aggregate(InviteLinks.InviteLink, :count, :id)
      assert invite_link_count == 1
    end

    def reset_invite_link(ctx) do
      mutation(ctx.conn, [:invitations, :reset_company_invite_link], %{})
    end
  end

  defp create_invite_link(ctx, attrs \\ %{}) do
    defaults = %{company_id: ctx.company.id, author_id: ctx.creator.id}
    {:ok, invite_link} = InviteLinks.create_invite_link(Map.merge(defaults, attrs))
    Repo.preload(invite_link, [:author, :company])
  end
end
