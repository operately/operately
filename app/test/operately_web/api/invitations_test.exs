defmodule OperatelyWeb.Api.InvitationsTest do
  use OperatelyWeb.TurboCase

  alias Operately.InviteLinks
  alias Operately.Repo

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "get_invite_link" do
    test "returns nil when token is unknown", ctx do
      assert {200, %{invite_link: nil}} =
               query(ctx.conn, :get_invite_link, %{token: "missing-token"})
    end

    test "returns serialized invite link when token matches", ctx do
      invite_link = create_invite_link(ctx)

      assert {200, %{invite_link: res}} =
               query(ctx.conn, :get_invite_link, %{token: invite_link.token})

      assert res == Serializer.serialize(invite_link, level: :full)
    end
  end

  describe "list_invite_links" do
    test "requires authentication", ctx do
      assert {401, _} =
               query(ctx.conn, :list_invite_links, %{
                 "company_id" => ctx.company.id
               })
    end

    test "requires company_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, %{message: %{message: message}}} = query(ctx.conn, :list_invite_links, %{})

      assert message == "Missing required fields: company_id"
    end

    test "returns not found when company is inaccessible", ctx do
      ctx =
        ctx |> Factory.add_company(:other_company, ctx.account) |> Factory.log_in_person(:creator)

      assert {404, _} =
               query(ctx.conn, :list_invite_links, %{
                 "company_id" => ctx.other_company.id
               })
    end

    test "returns invite links for the company", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      invite_link = create_invite_link(ctx)

      assert {200, %{invite_links: links}} =
               query(ctx.conn, :list_invite_links, %{
                 "company_id" => ctx.company.id
               })

      assert links == [Serializer.serialize(invite_link, level: :essential)]
    end
  end

  describe "create_invite_link" do
    test "requires authentication", ctx do
      assert {401, _} =
               mutation(ctx.conn, :create_invite_link, %{
                 "company_id" => ctx.company.id
               })
    end

    test "requires company_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, %{message: %{message: message}}} =
               mutation(ctx.conn, :create_invite_link, %{})

      assert message == "Missing required fields: company_id"
    end

    test "returns forbidden when person lacks permission", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {403, %{message: message}} =
               mutation(ctx.conn, :create_invite_link, %{
                 "company_id" => ctx.company.id
               })

      assert message == "You don't have permission to perform this action"
    end

    test "creates and returns invite link for authorized person", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, %{invite_link: res}} =
               mutation(ctx.conn, :create_invite_link, %{
                 "company_id" => ctx.company.id
               })

      stored = InviteLinks.get_invite_link_by_token(res.token)
      assert res == Serializer.serialize(stored, level: :full)
    end
  end

  describe "join_company_via_invite_link" do
    test "returns error when token is unknown", ctx do
      assert {200, %{company: nil, person: nil, error: error}} =
               mutation(ctx.conn, :join_company_via_invite_link, %{
                 token: "bad-token"
               })

      assert error == "Invalid invite link"
    end

    test "returns error when invite link is inactive", ctx do
      invite_link = create_invite_link(ctx)
      {:ok, inactive} = InviteLinks.revoke_invite_link(invite_link)

      assert {200, %{company: nil, person: nil, error: error}} =
               mutation(ctx.conn, :join_company_via_invite_link, %{
                 token: inactive.token
               })

      assert error == "This invite link is no longer valid"
    end

    test "returns error when invite link is expired", ctx do
      invite_link = create_invite_link(ctx)

      expired_at =
        DateTime.utc_now()
        |> DateTime.truncate(:second)
        |> DateTime.add(-60, :second)

      {:ok, expired} = InviteLinks.update_invite_link(invite_link, %{expires_at: expired_at})

      assert {200, %{company: nil, person: nil, error: error}} =
               mutation(ctx.conn, :join_company_via_invite_link, %{
                 token: expired.token
               })

      assert error == "This invite link has expired"
    end

    test "requires password for new users", ctx do
      invite_link = create_invite_link(ctx)

      assert {200, %{error: error}} =
               mutation(ctx.conn, :join_company_via_invite_link, %{
                 token: invite_link.token
               })

      assert error == "Password required for new users"
    end

    test "validates matching passwords for new users", ctx do
      invite_link = create_invite_link(ctx)

      assert {200, %{error: error}} =
               mutation(ctx.conn, :join_company_via_invite_link, %{
                 token: invite_link.token,
                 password: "secret",
                 password_confirmation: "different"
               })

      assert error == "Passwords don't match"
    end

    test "asks new users to complete signup flow first", ctx do
      invite_link = create_invite_link(ctx)

      assert {200, %{error: error}} =
               mutation(ctx.conn, :join_company_via_invite_link, %{
                 token: invite_link.token,
                 password: "secret",
                 password_confirmation: "secret"
               })

      assert error == "Please sign up first and then use this invite link"
    end

    test "returns company and person when already a member", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      invite_link = create_invite_link(ctx)

      assert {200, %{company: company, person: person, error: nil}} =
               mutation(ctx.conn, :join_company_via_invite_link, %{
                 token: invite_link.token
               })

      assert company == Serializer.serialize(invite_link.company, level: :essential)
      assert person == Serializer.serialize(ctx.creator, level: :essential)
    end
  end

  describe "revoke_invite_link" do
    test "requires authentication", ctx do
      invite_link = create_invite_link(ctx)

      assert {401, _} =
               mutation(ctx.conn, :revoke_invite_link, %{
                 "invite_link_id" => invite_link.id
               })
    end

    test "requires invite_link_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, %{message: %{message: message}}} =
               mutation(ctx.conn, :revoke_invite_link, %{})

      assert message == "Missing required fields: invite_link_id"
    end

    test "returns forbidden when person lacks permission", ctx do
      invite_link = create_invite_link(ctx)

      ctx =
        ctx
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {403, %{message: message}} =
               mutation(ctx.conn, :revoke_invite_link, %{
                 "invite_link_id" => invite_link.id
               })

      assert message == "You don't have permission to perform this action"
    end

    test "revokes invite link for authorized person", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      invite_link = create_invite_link(ctx)

      assert {200, %{invite_link: res}} =
               mutation(ctx.conn, :revoke_invite_link, %{
                 "invite_link_id" => invite_link.id
               })

      assert res.is_active == false

      stored = InviteLinks.get_invite_link_by_token(res.token)
      assert stored.is_active == false
      assert res == Serializer.serialize(stored, level: :full)
    end
  end

  defp create_invite_link(ctx, attrs \\ %{}) do
    defaults = %{company_id: ctx.company.id, author_id: ctx.creator.id}

    attrs =
      attrs
      |> Map.update(:expires_at, nil, fn datetime -> DateTime.truncate(datetime, :second) end)

    {:ok, invite_link} = InviteLinks.create_invite_link(Map.merge(defaults, attrs))
    Repo.preload(invite_link, [:author, :company])
  end
end
