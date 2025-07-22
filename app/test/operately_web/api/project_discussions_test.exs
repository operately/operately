defmodule OperatelyWeb.Api.ProjectDiscussionsTest do
  alias Operately.Support.RichText
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_project(:project, :marketing)
  end

  describe "get project discussion" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:project_discussions, :get], %{})
    end

    # test "it requires an id", ctx do
    #   ctx = Factory.log_in_person(ctx, :creator)

    #   assert {400, res} = query(ctx.conn, [:project_discussions, :get], %{})
    #   assert res.message == "Missing required fields: id"
    # end

    # test "it returns 404 if the discussion does not exist", ctx do
    #   ctx = Factory.log_in_person(ctx, :creator)

    #   discussion_id = Ecto.UUID.generate() |> Paths.update_id()
    #   assert {404, res} = query(ctx.conn, [:project_discussions, :get], %{id: discussion_id})
    #   assert res.message == "Discussion not found"
    # end

    # test "it returns the discussion", ctx do
    #   ctx = Factory.log_in_person(ctx, :creator)
    #   ctx = create_project_discussion(ctx)

    #   assert {200, res} = query(ctx.conn, [:project_discussions, :get], %{id: Paths.update_id(ctx.discussion)})
    #   assert res.discussion.id == Paths.update_id(ctx.discussion)
    # end
  end

  describe "list project discussions" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:project_discussions, :list], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:project_discussions, :list], %{})
      assert res.message == "Missing required fields: project_id"
    end

    #   test "it returns 404 if the project does not exist", ctx do
    #     ctx = Factory.log_in_person(ctx, :creator)

    #     project_id = Ecto.UUID.generate() |> Paths.project_id()
    #     assert {404, res} = query(ctx.conn, [:project_discussions, :list], %{project_id: project_id})
    #     assert res.message == "Project not found"
    #   end

    #   test "it returns discussions for the project", ctx do
    #     ctx = Factory.log_in_person(ctx, :creator)
    #     ctx = create_project_discussion(ctx)

    #     assert {200, res} = query(ctx.conn, [:project_discussions, :list], %{project_id: Paths.project_id(ctx.project)})
    #     assert length(res.discussions) == 1
    #     assert hd(res.discussions).id == Paths.update_id(ctx.discussion)
    #   end

    #   test "it returns empty list when no discussions exist", ctx do
    #     ctx = Factory.log_in_person(ctx, :creator)

    #     assert {200, res} = query(ctx.conn, [:project_discussions, :list], %{project_id: Paths.project_id(ctx.project)})
    #     assert res.discussions == []
    #   end
  end

  describe "create project discussion" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:project_discussions, :create], %{})
    end

    test "it requires project_id, title, and body", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:project_discussions, :create], %{})
      assert res.message == "Missing required fields: project_id, title, message"
    end

    test "it returns 404 if the project does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        project_id: Paths.project_id(%{id: Ecto.UUID.generate(), name: "Nonexistent Project"}),
        title: "Test Discussion",
        message: RichText.rich_text("Hello", :as_string)
      }

      assert {404, res} = mutation(ctx.conn, [:project_discussions, :create], inputs)
      assert res.message == "Project not found"
    end

    test "it creates a project discussion", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        project_id: Paths.project_id(ctx.project),
        title: "Test Discussion",
        message: RichText.rich_text("Hello", :as_string)
      }

      assert {200, res} = mutation(ctx.conn, [:project_discussions, :create], inputs)
      assert res.discussion.title == "Test Discussion"
      assert res.discussion.message == RichText.rich_text("Hello", :as_string)
    end
  end

  describe "edit project discussion" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:project_discussions, :edit], %{})
    end

    test "it requires id, title, and body", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:project_discussions, :edit], %{})
      assert res.message == "Missing required fields: id, title, message"
    end

    test "it returns 404 if the discussion does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      discussion_id = Ecto.UUID.generate() |> Operately.ShortUuid.encode!()

      inputs = %{
        id: discussion_id,
        title: "Updated Discussion",
        message: RichText.rich_text("Updated content", :as_string)
      }

      assert {404, res} = mutation(ctx.conn, [:project_discussions, :edit], inputs)
      assert res.message == "Discussion not found"
    end

    test "it updates the discussion", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_project_discussion(ctx, :discussion, :project)

      inputs = %{
        id: Paths.comment_thread_id(ctx.discussion),
        title: "Updated Discussion Title",
        message: RichText.rich_text("Updated content", :as_string)
      }

      assert {200, res} = mutation(ctx.conn, [:project_discussions, :edit], inputs)
      assert res.discussion.title == "Updated Discussion Title"

      # Verify the discussion was updated in the database
      discussion = Operately.Repo.get(Operately.Comments.CommentThread, ctx.discussion.id)
      assert discussion.title == "Updated Discussion Title"
      assert discussion.message == RichText.rich_text("Updated content")
    end
  end
end
