defmodule OperatelyWeb.Api.ProjectDiscussionsTest do
  alias Operately.Support.RichText
  use OperatelyWeb.TurboCase
  use Operately.Support.Notifications

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

    test "it requires an id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:project_discussions, :get], %{})
      assert res.message == "Missing required fields: id"
    end

    test "it returns 404 if the discussion does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      discussion_id = Ecto.UUID.generate() |> Operately.ShortUuid.encode!()
      assert {404, res} = query(ctx.conn, [:project_discussions, :get], %{id: discussion_id})
      assert res.message == "Discussion not found"
    end

    test "it returns the discussion", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_project_discussion(ctx, :discussion, :project)

      id = Paths.comment_thread_id(ctx.discussion)

      assert {200, res} = query(ctx.conn, [:project_discussions, :get], %{id: id})
      assert res.discussion.id == id
    end

    test "include space", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_project_discussion(ctx, :discussion, :project)

      id = Paths.comment_thread_id(ctx.discussion)

      assert {200, res} = query(ctx.conn, [:project_discussions, :get], %{id: id, include_space: true})
      assert res.discussion.space.id == Paths.space_id(ctx.marketing)
    end
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

    test "it returns 404 if the project does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      project_id = Ecto.UUID.generate() |> Operately.ShortUuid.encode!()
      assert {404, res} = query(ctx.conn, [:project_discussions, :list], %{project_id: project_id})
      assert res.message == "Project not found"
    end

    test "it returns discussions for the project", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_project_discussion(ctx, :discussion1, :project)
      ctx = Factory.add_project_discussion(ctx, :discussion2, :project)

      assert {200, res} = query(ctx.conn, [:project_discussions, :list], %{project_id: Paths.project_id(ctx.project)})
      assert length(res.discussions) == 2
      assert hd(res.discussions).id == Paths.comment_thread_id(ctx.discussion1)
      assert hd(tl(res.discussions)).id == Paths.comment_thread_id(ctx.discussion2)
    end

    test "it returns empty list when no discussions exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:project_discussions, :list], %{project_id: Paths.project_id(ctx.project)})
      assert res.discussions == []
    end
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

    test "it creates an activity when a discussion is created", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      action = "project_discussion_submitted"
      before_count = count_activities(ctx.project.id, action)

      inputs = %{
        project_id: Paths.project_id(ctx.project),
        title: "Discussion Activity Test",
        message: RichText.rich_text("Hello", :as_string)
      }

      assert {200, res} = mutation(ctx.conn, [:project_discussions, :create], inputs)

      after_count = count_activities(ctx.project.id, action)
      assert after_count == before_count + 1

      activity = get_activity(ctx.project.id, action)
      assert activity.content["project_id"] == ctx.project.id

      {_, discussion_id} = OperatelyWeb.Api.Helpers.decode_id(res.discussion.id)
      assert activity.content["discussion_id"] == discussion_id
      assert activity.comment_thread_id == discussion_id
    end

    test "it notifies subscribers when a discussion is created", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:subscriber, :project, :as_person)
        |> Factory.log_in_person(:creator)

      action = "project_discussion_submitted"
      assert notifications_count(action: action) == 0

      inputs = %{
        project_id: Paths.project_id(ctx.project),
        title: "Notify Discussion",
        message: RichText.rich_text("Ping", :as_string),
        subscriber_ids: [Paths.person_id(ctx.subscriber)]
      }

      assert {200, _} = mutation(ctx.conn, [:project_discussions, :create], inputs)
      activity = get_activity(ctx.project.id, action)
      notifications = fetch_notifications(activity.id, action: action)

      refute notifications == []
      assert Enum.any?(notifications, &(&1.person_id == ctx.subscriber.id))
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

  import Ecto.Query, only: [from: 2]

  defp count_activities(project_id, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["project_id"] == ^project_id
    )
    |> Repo.aggregate(:count)
  end

  defp get_activity(project_id, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["project_id"] == ^project_id,
      order_by: [desc: a.inserted_at],
      limit: 1
    )
    |> Repo.one()
  end
end
