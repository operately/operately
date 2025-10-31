defmodule OperatelyWeb.Api.Mutations.DeleteCommentTest do
  use OperatelyWeb.TurboCase

  alias Operately.Repo
  alias Operately.Updates.Comment

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :delete_comment, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:member, :space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_contributor(:project_member, :project, :as_person)
      |> Factory.add_project_check_in(:check_in, :project, :creator)
      |> Factory.preload(:check_in, :project)
      |> Factory.add_comment(:comment, :check_in)
    end

    test "author can delete comment", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} =
               mutation(ctx.conn, :delete_comment, %{
                 comment_id: Paths.comment_id(ctx.comment),
                 parent_type: "project_check_in"
               })

      assert res.comment.id == Paths.comment_id(ctx.comment)
      refute Repo.get(Comment, ctx.comment.id)
    end

    test "non-author cannot delete comment", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      assert {403, res} =
               mutation(ctx.conn, :delete_comment, %{
                 comment_id: Paths.comment_id(ctx.comment),
                 parent_type: "project_check_in"
               })

      assert res.message == "You don't have permission to perform this action"
      assert Repo.get(Comment, ctx.comment.id)
    end
  end

  describe "not found" do
    setup ctx do
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_check_in(:check_in, :project, :creator)
      |> Factory.preload(:check_in, :project)
      |> Factory.log_in_person(:creator)
    end

    test "returns not found when comment does not exist", ctx do
      assert {404, res} =
               mutation(ctx.conn, :delete_comment, %{
                 comment_id: Ecto.UUID.generate(),
                 parent_type: "project_check_in"
               })

      assert res.message == "The requested resource was not found"
    end
  end
end
