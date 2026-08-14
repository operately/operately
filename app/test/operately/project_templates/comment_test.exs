defmodule Operately.ProjectTemplates.CommentTest do
  use Operately.DataCase

  alias Operately.ProjectTemplates.Comment

  setup do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.add_project_template(:template, :space) |> Factory.add_project_template_discussion(:discussion, :template)
    {:ok, ctx}
  end

  test "requires template ownership, parent, content, and a non-negative position", ctx do
    changeset = Comment.changeset(%{})

    assert errors_on(changeset) == %{
             project_template_id: ["can't be blank"],
             parent_type: ["can't be blank"],
             parent_id: ["can't be blank"],
             content: ["can't be blank"],
             position: ["can't be blank"]
           }

    refute Comment.changeset(%{
             project_template_id: ctx.template.id,
             parent_type: :discussion,
             parent_id: ctx.discussion.id,
             content: %{"type" => "doc", "content" => []},
             position: -1
           }).valid?

    assert Comment.changeset(%{
             project_template_id: ctx.template.id,
             parent_type: :discussion,
             parent_id: ctx.discussion.id,
             content: %{"type" => "doc", "content" => []},
             position: 0
           }).valid?
  end

  test "deleting a template removes comments", ctx do
    ctx = Factory.add_project_template_comment(ctx, :comment, :template, :discussion)

    Repo.delete!(ctx.template)

    assert Repo.get(Comment, ctx.comment.id) == nil
  end

  test "deleting an author preserves the comment and clears its author", ctx do
    ctx = Factory.add_project_template_comment(ctx, :comment, :template, :discussion)

    Repo.delete!(ctx.creator)

    assert Repo.get!(Comment, ctx.comment.id).author_id == nil
  end
end
