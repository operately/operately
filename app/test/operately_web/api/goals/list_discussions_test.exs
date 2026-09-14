defmodule OperatelyWeb.Api.Goals.ListDiscussionsTest do
  use OperatelyWeb.TurboCase

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  describe "list discussions" do
    test "declares goal discussions as its response type" do
      assert %{fields: [{:discussions, {:list, :goal_discussion}, _}]} =
               OperatelyWeb.Api.Goals.ListDiscussions.__outputs__()
    end

    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:goals, :list_discussions], %{})
    end

    test "it requires a goal_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:goals, :list_discussions], %{})
      assert res.message == "Missing required fields: goal_id"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      goal_id = Ecto.UUID.generate() |> Paths.goal_id()
      assert {404, res} = query(ctx.conn, [:goals, :list_discussions], %{goal_id: goal_id})
      assert res.message == "Goal not found"
    end

    test "it returns discussions for the goal", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_goal_discussion(ctx, :discussion, :goal)

      assert {200, res} = query(ctx.conn, [:goals, :list_discussions], %{goal_id: Paths.goal_id(ctx.goal)})
      assert [discussion] = res.discussions
      assert discussion.id == Paths.goal_discussion_id(ctx.discussion)
      assert discussion.title == ctx.discussion.title
      assert discussion.author.id == Paths.person_id(ctx.creator)
      assert discussion.content == Jason.encode!(ctx.discussion.message)
      assert is_binary(discussion.activity_id)
      assert discussion.comment_count == 0
    end

    test "it returns goal discussion fields through the external API", ctx do
      ctx =
        ctx
        |> Factory.add_goal_discussion(:discussion, :goal)
        |> Factory.add_api_token(:api_token, :creator, read_only: true)

      assert {200, %{discussions: [discussion]}} =
               external_query(ctx.conn, ctx.api_token, "goals/list_discussions", %{goal_id: Paths.goal_id(ctx.goal)})

      assert discussion.id == Paths.goal_discussion_id(ctx.discussion)
      assert OperatelyWeb.Api.Helpers.decode_id(discussion.activity_id) == {:ok, ctx.discussion.parent_id}
      assert discussion.content == Jason.encode!(ctx.discussion.message)
    end
  end
end
