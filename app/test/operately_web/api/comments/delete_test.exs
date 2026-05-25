defmodule OperatelyWeb.Api.Comments.DeleteTest do
  use OperatelyWeb.TurboCase

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Updates.Comment

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:comments, :delete], %{})
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
               mutation(ctx.conn, [:comments, :delete], %{
                 comment_id: Paths.comment_id(ctx.comment),
                 parent_type: "project_check_in"
               })

      assert res.comment.id == Paths.comment_id(ctx.comment)
      refute Repo.get(Comment, ctx.comment.id)
    end

    test "deleting a project task comment leaves a task activity trace", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, nil, project_id: ctx.project.id, name: "Launch task")
        |> Factory.preload(:task, :project)
        |> Factory.add_comment(:task_comment, :task)
        |> Factory.log_in_person(:creator)

      assert {200, _res} =
               mutation(ctx.conn, [:comments, :delete], %{
                 comment_id: Paths.comment_id(ctx.task_comment),
                 parent_type: "project_task"
               })

      activity = Repo.get_by!(Activity, action: "task_comment_deleting")

      assert activity.author_id == ctx.creator.id
      assert activity.content["company_id"] == ctx.company.id
      assert activity.content["space_id"] == ctx.project.group_id
      assert activity.content["project_id"] == ctx.project.id
      assert activity.content["task_id"] == ctx.task.id
      assert activity.content["task_name"] == "Launch task"
      assert activity.content["comment_id"] == ctx.task_comment.id
    end

    test "deleting a space task comment leaves a task activity trace", ctx do
      ctx =
        ctx
        |> Factory.create_space_task(:space_task, :space, name: "Inbox task")
        |> Factory.log_in_person(:creator)

      comment =
        Operately.CommentsFixtures.comment_fixture(ctx.creator, %{
          entity_id: ctx.space_task.id,
          entity_type: :space_task
        })

      assert {200, _res} =
               mutation(ctx.conn, [:comments, :delete], %{
                 comment_id: Paths.comment_id(comment),
                 parent_type: "space_task"
               })

      activity = Repo.get_by!(Activity, action: "task_comment_deleting")

      assert activity.author_id == ctx.creator.id
      assert activity.content["company_id"] == ctx.company.id
      assert activity.content["space_id"] == ctx.space.id
      assert activity.content["project_id"] == nil
      assert activity.content["task_id"] == ctx.space_task.id
      assert activity.content["task_name"] == "Inbox task"
      assert activity.content["comment_id"] == comment.id
    end

    test "non-author cannot delete comment", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      assert {403, res} =
               mutation(ctx.conn, [:comments, :delete], %{
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
               mutation(ctx.conn, [:comments, :delete], %{
                 comment_id: Ecto.UUID.generate(),
                 parent_type: "project_check_in"
               })

      assert res.message == "The requested resource was not found"
    end
  end
end
