defmodule OperatelyWeb.Api.Projects.DiscussionsTest do
  alias Operately.Support.RichText
  alias Operately.Notifications.SubscriptionList

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
      assert {401, _} = query(ctx.conn, [:projects, :get_discussion], %{})
    end

    test "it requires an id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:projects, :get_discussion], %{})
      assert res.message == "Missing required fields: id"
    end

    test "it returns 404 if the discussion does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      discussion_id = Ecto.UUID.generate() |> Operately.ShortUuid.encode!()
      assert {404, res} = query(ctx.conn, [:projects, :get_discussion], %{id: discussion_id})
      assert res.message == "Discussion not found"
    end

    test "it returns the discussion", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_project_discussion(ctx, :discussion, :project)

      id = Paths.comment_thread_id(ctx.discussion)

      assert {200, res} = query(ctx.conn, [:projects, :get_discussion], %{id: id})
      assert res.discussion.id == id
    end

    test "include space", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_project_discussion(ctx, :discussion, :project)

      id = Paths.comment_thread_id(ctx.discussion)

      assert {200, res} = query(ctx.conn, [:projects, :get_discussion], %{id: id, include_space: true})
      assert res.discussion.space.id == Paths.space_id(ctx.marketing)
    end

    test "include space returns nil when person cannot access the space", ctx do
      ctx = Factory.add_project_contributor(ctx, :contributor, :project, :as_person)
      ctx = Factory.add_project_discussion(ctx, :discussion, :project)
      ctx = Factory.log_in_person(ctx, :contributor)

      id = Paths.comment_thread_id(ctx.discussion)

      assert {200, res} = query(ctx.conn, [:projects, :get_discussion], %{id: id, include_space: true})
      assert res.discussion.space == nil
    end

    test "include potential subscribers with a suspended contributor", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_project_contributor(ctx, :suspended_contributor, :project, :as_person)
      ctx = Factory.suspend_company_member(ctx, :suspended_contributor)
      ctx = Factory.add_project_discussion(ctx, :discussion, :project)

      id = Paths.comment_thread_id(ctx.discussion)

      assert {200, _res} = query(ctx.conn, [:projects, :get_discussion], %{
        id: id,
        include_project: true,
        include_potential_subscribers: true,
        include_subscriptions_list: true,
        include_permissions: true,
      })
    end
  end

  test "project discussion replies and reactions keep their public identifiers and project context", ctx do
    ctx = ctx |> Factory.add_project_discussion(:discussion, :project) |> Factory.log_in_person(:creator)
    target = %{entity_id: Paths.comment_thread_id(ctx.discussion), entity_type: "project_discussion"}
    assert {200, %{comment: %{id: reply_id}}} = mutation(ctx.conn, [:comments, :create], Map.put(target, :content, RichText.rich_text("Reply", :as_string)))
    assert {200, _} = mutation(ctx.conn, [:reactions, :create], Map.put(target, :emoji, "👍"))
    assert {200, _} = mutation(ctx.conn, [:reactions, :create], %{entity_type: "comment", entity_id: reply_id, parent_type: "project_discussion", emoji: "👍"})
    assert {200, %{comments: [%{id: ^reply_id, reactions: [_]}]}} = query(ctx.conn, [:comments, :list], target)
    assert {200, %{discussion: %{reactions: [_]}}} = query(ctx.conn, [:projects, :get_discussion], %{id: target.entity_id})

    activity = get_activity(ctx.project.id, "discussion_comment_submitted")
    assert activity.access_context_id == Repo.preload(ctx.project, :access_context).access_context.id

    Repo.soft_delete!(ctx.discussion)
    assert {200, %{comments: []}} = query(ctx.conn, [:comments, :list], target)
    assert {404, _} = mutation(ctx.conn, [:reactions, :create], %{entity_type: "comment", entity_id: reply_id, parent_type: "project_discussion", emoji: "👍"})
  end

  describe "list project discussions" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:projects, :list_discussions], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:projects, :list_discussions], %{})
      assert res.message == "Missing required fields: project_id"
    end

    test "it returns 404 if the project does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      project_id = Ecto.UUID.generate() |> Operately.ShortUuid.encode!()
      assert {404, res} = query(ctx.conn, [:projects, :list_discussions], %{project_id: project_id})
      assert res.message == "Project not found"
    end

    test "it returns discussions for the project", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_project_discussion(ctx, :discussion1, :project)
      ctx = Factory.add_project_discussion(ctx, :discussion2, :project)

      # inserted_at is second-precision; pin times so newest-first order is deterministic
      set_inserted_at(ctx.discussion1, ~N[2024-01-01 12:00:00])
      set_inserted_at(ctx.discussion2, ~N[2024-01-01 12:00:01])

      assert {200, res} = query(ctx.conn, [:projects, :list_discussions], %{project_id: Paths.project_id(ctx.project)})
      assert length(res.discussions) == 2
      assert Enum.map(res.discussions, & &1.id) == [
        Paths.comment_thread_id(ctx.discussion2),
        Paths.comment_thread_id(ctx.discussion1)
      ]
    end

    test "it returns empty list when no discussions exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:projects, :list_discussions], %{project_id: Paths.project_id(ctx.project)})
      assert res.discussions == []
    end
  end

  describe "create project discussion" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :create_discussion], %{})
    end

    test "it requires project_id, title, and body", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:projects, :create_discussion], %{})
      assert res.message == "Missing required fields: project_id, title, message"
    end

    test "it returns 404 if the project does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        project_id: Paths.project_id(%{id: Ecto.UUID.generate(), name: "Nonexistent Project"}),
        title: "Test Discussion",
        message: RichText.rich_text("Hello", :as_string)
      }

      assert {404, res} = mutation(ctx.conn, [:projects, :create_discussion], inputs)
      assert res.message == "Project not found"
    end

    test "it rejects a blank title", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      input = %{project_id: Paths.project_id(ctx.project), title: "", message: RichText.rich_text("Hello", :as_string)}

      assert {400, _} = mutation(ctx.conn, [:projects, :create_discussion], input)
    end

    test "it creates a project discussion", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        project_id: Paths.project_id(ctx.project),
        title: "Test Discussion",
        message: RichText.rich_text("Hello", :as_string)
      }

      assert {200, res} = mutation(ctx.conn, [:projects, :create_discussion], inputs)
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

      assert {200, res} = mutation(ctx.conn, [:projects, :create_discussion], inputs)

      after_count = count_activities(ctx.project.id, action)
      assert after_count == before_count + 1

      activity = get_activity(ctx.project.id, action)
      assert activity.content["project_id"] == ctx.project.id

      {_, discussion_id} = OperatelyWeb.Api.Helpers.decode_id(res.discussion.id)
      assert activity.content["discussion_id"] == discussion_id
      assert is_nil(activity.comment_thread_id)
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

      assert {200, _} = mutation(ctx.conn, [:projects, :create_discussion], inputs)
      activity = get_activity(ctx.project.id, action)
      notifications = fetch_notifications(activity.id, action: action)

      refute notifications == []
      assert Enum.any?(notifications, &(&1.person_id == ctx.subscriber.id))
    end

    test "uses defaults for omitted optional inputs", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        project_id: Paths.project_id(ctx.project),
        title: "Default Discussion",
        message: RichText.rich_text("Hello", :as_string)
      }

      assert {200, res} = mutation(ctx.conn, [:projects, :create_discussion], inputs)
      assert res.discussion.title == "Default Discussion"

      {:ok, discussion_id} = OperatelyWeb.Api.Helpers.decode_id(res.discussion.id)
      discussion = Operately.Repo.get(Operately.Messages.Message, discussion_id)
      {:ok, list} = SubscriptionList.get(:system, parent_id: discussion.id, opts: [preload: :subscriptions])

      refute list.send_to_everyone
      assert length(list.subscriptions) == 1
      assert hd(list.subscriptions).person_id == ctx.creator.id
    end
  end

  describe "update project discussion" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :update_discussion], %{})
    end

    test "it requires id, title, and body", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:projects, :update_discussion], %{})
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

      assert {404, res} = mutation(ctx.conn, [:projects, :update_discussion], inputs)
      assert res.message == "Discussion not found"
    end

    test "clearing the title rejects the whole edit", ctx do
      ctx = ctx |> Factory.log_in_person(:creator) |> Factory.add_project_discussion(:discussion, :project)
      input = %{id: Paths.message_id(ctx.discussion), title: "  ", message: RichText.rich_text("Edited", :as_string)}

      assert {400, _} = mutation(ctx.conn, [:projects, :update_discussion], input)
      discussion = Repo.reload!(ctx.discussion)
      assert discussion.title == ctx.discussion.title
      assert discussion.body == ctx.discussion.body
    end

    test "a migrated untitled discussion can be opened and given a title", ctx do
      ctx = ctx |> Factory.log_in_person(:creator) |> Factory.add_project_discussion(:discussion, :project)
      message = ctx.discussion |> Ecto.Changeset.change(title: nil) |> Repo.update!()
      id = Paths.comment_thread_id(message)

      assert id == Paths.message_id(message)
      assert {200, %{discussion: %{id: ^id}}} = query(ctx.conn, [:projects, :get_discussion], %{id: id})
      assert {:ok, _} = Operately.Search.SourceIndexer.sync("discussion", message.id)
      input = %{id: id, title: "Restored title", message: RichText.rich_text("Edited", :as_string)}
      assert {200, %{discussion: %{title: "Restored title"}}} = mutation(ctx.conn, [:projects, :update_discussion], input)
    end

    test "it updates the discussion", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_project_discussion(ctx, :discussion, :project)

      inputs = %{
        id: Paths.comment_thread_id(ctx.discussion),
        title: "Updated Discussion Title",
        message: RichText.rich_text("Updated content", :as_string)
      }

      assert {200, res} = mutation(ctx.conn, [:projects, :update_discussion], inputs)
      assert res.discussion.title == "Updated Discussion Title"

      # Verify the discussion was updated in the database
      discussion = Operately.Repo.get(Operately.Messages.Message, ctx.discussion.id)
      assert discussion.title == "Updated Discussion Title"
      assert discussion.body == RichText.rich_text("Updated content")
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

  defp set_inserted_at(discussion, inserted_at) do
    Repo.update_all(
      from(ct in Operately.Messages.Message, where: ct.id == ^discussion.id),
      set: [inserted_at: inserted_at]
    )
  end
end
