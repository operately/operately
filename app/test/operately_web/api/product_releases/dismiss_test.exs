defmodule OperatelyWeb.Api.ProductReleases.DismissTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = mutation(ctx.conn, [:product_releases, :dismiss], %{id: "v1.8"})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:member)
      |> Factory.log_in_person(:creator)
    end

    test "stores the dismissed release id on the current person", ctx do
      assert {200, %{success: true}} = mutation(ctx.conn, [:product_releases, :dismiss], %{id: "v1.8"})

      creator = Operately.People.get_person!(ctx.creator.id)
      member = Operately.People.get_person!(ctx.member.id)

      assert Operately.People.Person.dismissed_product_release_id(creator) == "v1.8"
      assert Operately.People.Person.dismissed_product_release_id(member) == nil

      assert {200, %{me: me}} = query(ctx.conn, [:people, :get_me], %{})
      assert me.dismissed_product_release_id == "v1.8"
    end

    test "rejects a missing id", ctx do
      assert {400, %{message: "Missing required fields: id"}} = mutation(ctx.conn, [:product_releases, :dismiss], %{})
    end

    test "rejects a blank id", ctx do
      assert {400, _} = mutation(ctx.conn, [:product_releases, :dismiss], %{id: ""})
    end

    test "rejects an oversized id", ctx do
      assert {400, _} = mutation(ctx.conn, [:product_releases, :dismiss], %{id: String.duplicate("a", 513)})
    end
  end
end
