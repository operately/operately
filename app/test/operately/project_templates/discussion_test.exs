defmodule Operately.ProjectTemplates.DiscussionTest do
  use Operately.DataCase

  alias Operately.ProjectTemplates.Discussion

  setup do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.add_project_template(:template, :space)
    {:ok, ctx}
  end

  test "requires template ownership, title, body, and position", ctx do
    changeset = Discussion.changeset(%{})

    assert errors_on(changeset) == %{
             project_template_id: ["can't be blank"],
             title: ["can't be blank"],
             body: ["can't be blank"],
             position: ["can't be blank"]
           }

    assert Discussion.changeset(%{
             project_template_id: ctx.template.id,
             title: "Reusable context",
             body: %{"type" => "doc", "content" => []},
             position: 0
           }).valid?
  end

  test "deleting a template removes discussions", ctx do
    ctx = Factory.add_project_template_discussion(ctx, :discussion, :template)

    Repo.delete!(ctx.template)

    assert Repo.get(Discussion, ctx.discussion.id) == nil
  end

  test "deleting an author preserves the discussion and clears its author", ctx do
    ctx = Factory.add_project_template_discussion(ctx, :discussion, :template)

    Repo.delete!(ctx.creator)

    assert Repo.get!(Discussion, ctx.discussion.id).author_id == nil
  end
end
