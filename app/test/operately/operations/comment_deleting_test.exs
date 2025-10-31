defmodule Operately.Operations.CommentDeletingTest do
  use Operately.DataCase, async: true

  import Ecto.Query

  alias Operately.Activities
  alias Operately.Activities.Activity
  alias Operately.Operations.CommentDeleting
  alias Operately.Repo
  alias Operately.Updates.Comment
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.preload(:project, :access_context)
    |> Factory.add_project_check_in(:check_in, :project, :creator)
    |> Factory.preload(:check_in, :project)
    |> Factory.add_comment(:comment, :check_in)
  end

  test "removes the comment", ctx do
    {:ok, comment} = CommentDeleting.run(ctx.creator, ctx.comment)

    assert comment.id == ctx.comment.id
    refute Repo.get(Comment, ctx.comment.id)
  end

  test "creates an audit activity", ctx do
    {:ok, _comment} = CommentDeleting.run(ctx.creator, ctx.comment)

    activity =
      Activity
      |> where([a], a.action == "comment_deleted")
      |> Repo.one!()
      |> Activities.get_activity!()

    assert activity.author_id == ctx.creator.id
    assert activity.content.comment_id == ctx.comment.id
    assert activity.content.company_id == ctx.company.id
    assert activity.content.parent_type == :project_check_in
    assert activity.content.parent_id == ctx.check_in.id
    assert activity.access_context_id == ctx.project.access_context.id
  end
end
