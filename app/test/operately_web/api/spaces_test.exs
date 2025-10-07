defmodule OperatelyWeb.Api.SpacesTest do
  use OperatelyWeb.TurboCase

  alias Operately.People
  alias OperatelyWeb.Paths

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "search" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:spaces, :search], %{})
    end

    test "it returns spaces matching the query", ctx do
      ctx = Factory.add_space(ctx, :product, name: "Product Space")
      ctx = Factory.add_space(ctx, :marketing, name: "Marketing Space")
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:spaces, :search], %{query: "Product"})
      assert length(res.spaces) == 1
      assert res.spaces |> hd() |> Map.get(:name) == "Product Space"
    end
  end

  describe "list members" do
    setup ctx do
      ctx |> Factory.add_space(:space)
    end

    test "it requires authentication", ctx do
      assert {401, _} =
               query(ctx.conn, [:spaces, :list_members], %{space_id: Paths.space_id(ctx.space)})
    end

    test "it requires a space_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:spaces, :list_members], %{})
      assert res.message == "Missing required fields: space_id"
    end

    test "it returns an empty list when the person cannot view the space", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:outsider)
        |> Factory.log_in_person(:outsider)

      assert {200, res} =
               query(ctx.conn, [:spaces, :list_members], %{space_id: Paths.space_id(ctx.space)})

      assert res.people == []
    end

    test "it returns all members for authorized people", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:member1, :space, name: "Alice Example")
        |> Factory.add_space_member(:member2, :space, name: "Bob Builder")
        |> Factory.log_in_person(:creator)

      assert {200, res} =
               query(ctx.conn, [:spaces, :list_members], %{space_id: Paths.space_id(ctx.space)})

      ids = Enum.map(res.people, & &1.id)

      assert Paths.person_id(ctx.creator) in ids
      assert Paths.person_id(ctx.member1) in ids
      assert Paths.person_id(ctx.member2) in ids
    end

    test "it filters members by query across names and titles", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:member1, :space, name: "Alice Example")
        |> Factory.add_space_member(:member2, :space, name: "Bob Builder")
        |> Factory.add_space_member(:member3, :space, name: "Charlie Writer")
        |> Factory.log_in_person(:creator)

      {:ok, member3} = People.update_person(ctx.member3, %{title: "Designer"})
      ctx = Map.put(ctx, :member3, member3)

      assert {200, name_res} =
               query(ctx.conn, [:spaces, :list_members], %{
                 space_id: Paths.space_id(ctx.space),
                 query: "alice"
               })

      assert Enum.map(name_res.people, & &1.id) == [Paths.person_id(ctx.member1)]

      assert {200, title_res} =
               query(ctx.conn, [:spaces, :list_members], %{
                 space_id: Paths.space_id(ctx.space),
                 query: "designer"
               })

      assert Enum.map(title_res.people, & &1.id) == [Paths.person_id(ctx.member3)]
    end

    test "it excludes ignored ids and suspended members", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:member1, :space, name: "Alice Example")
        |> Factory.add_space_member(:member2, :space, name: "Bob Builder")
        |> Factory.log_in_person(:creator)
        |> Factory.suspend_company_member(:member2)

      assert {200, res} =
               query(ctx.conn, [:spaces, :list_members], %{
                 space_id: Paths.space_id(ctx.space),
                 ignored_ids: [Paths.person_id(ctx.member1)]
               })

      ids = Enum.map(res.people, & &1.id)

      refute Paths.person_id(ctx.member1) in ids
      refute Paths.person_id(ctx.member2) in ids
      assert Paths.person_id(ctx.creator) in ids
    end
  end
end
