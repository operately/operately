defmodule OperatelyWeb.Api.Mutations.EditDiscussionTest do
  use OperatelyWeb.TurboCase

  import Operately.Support.RichText
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.UpdatesFixtures

  alias Operately.{Repo, Access}
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_discussion, %{})
    end
  end

  describe "company permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator_id: creator.id})
    end

    test "company member can see only their company", ctx do
      other_ctx = register_and_log_in_account(ctx)
      discussion = create_discussion(ctx)

      assert {404, res} = request(other_ctx.conn, discussion)
      assert res.message == "The requested resource was not found"
    end

    test "company members without edit access can't edit discussion", ctx do
      discussion = create_discussion(ctx)

      assert {403, res} = request(ctx.conn, discussion)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company members with edit access can edit discussion", ctx do
      give_person_edit_access(ctx)
      discussion = create_discussion(ctx)

      assert {200, _} = request(ctx.conn, discussion)
      assert_discussion_edited(discussion)
    end

    test "company admins can edit discussion", ctx do
      discussion = create_discussion(ctx)

      # Not admin
      assert {403, _} = request(ctx.conn, discussion)

      # Admin
      {:ok, _} = Operately.Companies.add_admin(ctx.company_creator, ctx.person.id)

      assert {200, _} = request(ctx.conn, discussion)
      assert_discussion_edited(discussion)
    end
  end

  describe "space permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator_id: creator.id, space_id: space.id})
    end

    test "company member without view access can't see space", ctx do
      discussion = create_discussion(ctx)

      assert {404, res} = request(ctx.conn, discussion)
      assert res.message == "The requested resource was not found"
    end

    test "space member without edit access can't edit discussion", ctx do
      discussion = create_discussion(ctx)
      add_person_to_space(ctx, Binding.comment_access())

      assert {403, res} = request(ctx.conn, discussion)
      assert res.message == "You don't have permission to perform this action"
    end

    test "space members with edit access can edit discussion", ctx do
      discussion = create_discussion(ctx)
      add_person_to_space(ctx, Binding.edit_access())

      assert {200, _} = request(ctx.conn, discussion)
      assert_discussion_edited(discussion)
    end

    test "company admins can edit discussion", ctx do
      discussion = create_discussion(ctx)

      # Not admin
      assert {404, _} = request(ctx.conn, discussion)

      # Admin
      {:ok, _} = Operately.Companies.add_admin(ctx.company_creator, ctx.person.id)

      assert {200, _} = request(ctx.conn, discussion)
      assert_discussion_edited(discussion)
    end
  end

  describe "edit_discussion functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      Operately.Companies.add_admin(ctx.company_creator, ctx.person.id)

      ctx
    end

    test "edits discussion", ctx do
      discussion = create_discussion(ctx)

      assert {200, _} = request(ctx.conn, discussion)
      assert_discussion_edited(discussion)
    end
  end

  #
  # Steps
  #

  defp request(conn, discussion) do
    mutation(conn, :edit_discussion, %{
      discussion_id: Paths.discussion_id(discussion),
      title: "New title",
      body: rich_text("New body") |> Jason.encode!(),
    })
  end

  defp assert_discussion_edited(discussion) do
    discussion = Repo.reload(discussion)

    assert discussion.content["title"] == "New title"
    assert discussion.content["body"] == rich_text("New body")
  end

  #
  # Helpers
  #

  defp create_discussion(ctx) do
    update_fixture(%{
      author_id: ctx[:creator_id] || ctx.person.id,
      updatable_id: ctx[:space_id] || ctx.company.company_space_id,
      updatable_type: :space,
      type: :project_discussion,
      content: %{
        title: "Title",
        body: rich_text("Body")
      }
    })
  end

  defp give_person_edit_access(ctx) do
    group = Access.get_group!(company_id: ctx.company.id, tag: :standard)
    context = Access.get_context!(company_id: ctx.company.id)

    Access.get_binding!(group_id: group.id, context_id: context.id)
    |> Access.update_binding(%{access_level: Binding.edit_access()})
  end

  defp add_person_to_space(ctx, access_level) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      permissions: access_level,
    }])
  end
end
