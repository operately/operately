defmodule OperatelyWeb.Api.Mutations.PostDiscussionTest do
  use OperatelyWeb.TurboCase

  import Operately.Support.RichText
  import Operately.GroupsFixtures

  alias Operately.Access
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :post_discussion, %{})
    end
  end

  describe "company permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = Operately.Groups.get_group!(ctx.company.company_space_id)

      Map.merge(ctx, %{space: space})
    end

    test "company member can see only their company", ctx do
      other_ctx = register_and_log_in_account(ctx)

      assert {404, res} = request(other_ctx.conn, ctx.space)
      assert res.message == "The requested resource was not found"
    end

    test "company members without edit access can't create discussion", ctx do
      assert {403, res} = request(ctx.conn, ctx.space)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company members with edit access can create discussion", ctx do
      give_person_edit_access(ctx)

      assert {200, res} = request(ctx.conn, ctx.space)
      assert_discussion_created(res)
    end

    test "company admins can create discussion", ctx do
      # Not admin
      assert {403, _} = request(ctx.conn, ctx.space)

      # Admin
      {:ok, _} = Operately.Companies.add_admin(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, ctx.space)
      assert_discussion_created(res)
    end
  end

  describe "space permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space})
    end

    test "company member without view access can't see space", ctx do
      assert {404, res} = request(ctx.conn, ctx.space)
      assert res.message == "The requested resource was not found"
    end

    test "space member without edit access can't create discussion", ctx do
      add_person_to_space(ctx, Binding.comment_access())

      assert {403, res} = request(ctx.conn, ctx.space)
      assert res.message == "You don't have permission to perform this action"
    end

    test "space members with edit access can create discussion", ctx do
      add_person_to_space(ctx, Binding.edit_access())

      assert {200, res} = request(ctx.conn, ctx.space)
      assert_discussion_created(res)
    end

    test "company admins can create discussion", ctx do
      # Not admin
      assert {404, _} = request(ctx.conn, ctx.space)

      # Admin
      {:ok, _} = Operately.Companies.add_admin(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, ctx.space)
      assert_discussion_created(res)
    end
  end

  describe "post_discussion functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      Operately.Companies.add_admin(ctx.company_creator, ctx.person.id)

      ctx
    end

    test "creates discussion within space", ctx do
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})

      assert {200, res} = request(ctx.conn, space)
      assert_discussion_created(res)
    end

    test "creates discussion within company", ctx do
      space = Operately.Groups.get_group!(ctx.company.company_space_id)

      assert {200, res} = request(ctx.conn, space)
      assert_discussion_created(res)
    end
  end

  #
  # Steps
  #

  defp request(conn, space) do
    mutation(conn, :post_discussion, %{
      space_id: Paths.space_id(space),
      title: "Discussion",
      body: rich_text("Content") |> Jason.encode!(),
    })
  end

  defp assert_discussion_created(res) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.discussion.id)
    assert Operately.Updates.get_update!(id)
  end

  #
  # Helpers
  #

  defp give_person_edit_access(ctx) do
    group = Access.get_group!(company_id: ctx.company.id, tag: :standard)
    context = Access.get_context!(group_id: ctx.company.company_space_id)

    Access.get_binding!(group_id: group.id, context_id: context.id)
    |> Access.update_binding(%{access_level: Binding.edit_access()})
  end

  defp add_person_to_space(ctx, access_level) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      permissions: access_level,
    }])
  end
end
