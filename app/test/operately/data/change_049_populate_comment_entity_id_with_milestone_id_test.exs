defmodule Operately.Data.Change049PopulateCommentEntityIdWithMilestoneIdTest do
  use Operately.DataCase

  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
    |> create_comments()
  end

  test "Populates comment entity_id with milestone id", ctx do
    Enum.each(ctx.incomplete_comments, fn c ->
      refute c.comment.entity_id
      refute c.comment.entity_type
    end)

    Enum.each(ctx.complete_comments, fn c ->
      assert c.comment.entity_id == ctx.milestone.id
      assert c.comment.entity_type == :project_milestone
    end)

    Operately.Data.Change049PopulateCommentEntityIdWithMilestoneId.run()

    all_comments = ctx.incomplete_comments ++ ctx.complete_comments

    Enum.each(all_comments, fn c ->
      comment = Repo.reload(c.comment)

      assert comment.entity_id == ctx.milestone.id
      assert comment.entity_type == :project_milestone
    end)
  end

  test "Doesn't affect other comments", ctx do
    ctx = create_comments_for_other_resources(ctx)

    Operately.Data.Change049PopulateCommentEntityIdWithMilestoneId.run()

    assert_comment(ctx.update_comment, ctx.update.id, :goal_update)
    assert_comment(ctx.message_comment, ctx.message.id, :message)
    assert_comment(ctx.check_in_comment, ctx.check_in.id, :project_check_in)
    assert_comment(ctx.retrospective_comment, ctx.retrospective.id, :project_retrospective)
  end

  defp assert_comment(comment, entity_id, entity_type) do
    comment = Repo.reload(comment)
    assert comment.entity_id == entity_id
    assert comment.entity_type == entity_type
  end

  #
  # Helpers
  #

  defp create_comments(ctx) do
    incomplete_comments = Enum.map(1..3, fn _ -> create_comment(ctx) end)

    complete_comments =
      Enum.map(1..3, fn _ ->
        create_comment(ctx, %{
          entity_id: ctx.milestone.id,
          entity_type: :project_milestone
        })
      end)

    ctx
    |> Map.put(:incomplete_comments, incomplete_comments)
    |> Map.put(:complete_comments, complete_comments)
  end

  defp create_comment(ctx, attrs \\ %{}) do
    {:ok, comment} =
      Operately.Comments.create_milestone_comment(
        ctx.creator,
        ctx.milestone,
        "none",
        Map.merge(attrs, %{
          content: %{"message" => RichText.rich_text("content")},
          author_id: ctx.creator.id
        })
      )

    comment
  end

  defp create_comments_for_other_resources(ctx) do
    ctx
    # comment parents
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_goal_update(:update, :goal, :creator)
    |> Factory.preload(:update, :goal)
    |> Factory.add_messages_board(:board, :space)
    |> Factory.add_message(:message, :board)
    |> Factory.preload(:message, :space)
    |> Factory.add_project_check_in(:check_in, :project, :creator)
    |> Factory.preload(:check_in, :project)
    |> Factory.add_project_retrospective(:retrospective, :project, :creator)
    |> Factory.preload(:retrospective, :project)
    # comments
    |> Factory.add_comment(:update_comment, :update)
    |> Factory.add_comment(:message_comment, :message)
    |> Factory.add_comment(:check_in_comment, :check_in)
    |> Factory.add_comment(:retrospective_comment, :retrospective)
  end
end
