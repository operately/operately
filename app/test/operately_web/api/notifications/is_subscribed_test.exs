defmodule OperatelyWeb.Api.Notifications.IsSubscribedTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  import Ecto.Query, only: [from: 2]
  import Operately.KpisFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: "test",
        resource_type: "goal_update"
      })
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:member)
      |> Factory.add_space(:default_space)
      |> Factory.add_goal(:goal1, :default_space, company_access: Binding.no_access())
      |> Factory.add_goal_update(:update1, :goal1, :creator)
      |> Factory.log_in_person(:member)
    end

    test "returns 404 for non-existent resource", ctx do
      assert {404, _} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: Paths.goal_update_id(%{id: Ecto.UUID.generate(), inserted_at: DateTime.utc_now()}),
        resource_type: "goal_update"
      })
    end

    test "returns 404 when user does not have access to the resource", ctx do
      assert {404, _} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: Paths.goal_update_id(ctx.update1),
        resource_type: "goal_update"
      })
    end
  end

  describe "is_resource_subscribed functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:default_space)
      |> Factory.add_goal(:goal1, :default_space)
      |> Factory.add_goal_update(:update1, :goal1, :creator)
      |> Factory.add_project(:project1, :default_space)
      |> Factory.add_project_check_in(:check_in1, :project1, :creator)
      |> Factory.add_messages_board(:board1, :default_space)
      |> Factory.add_message(:message1, :board1)
      |> Factory.create_space_task(:space_task1, :default_space)
      |> then(fn ctx ->
        Map.put(ctx, :kpi1, kpi_fixture(ctx.creator, %{space_id: ctx.default_space.id}))
      end)
      |> Factory.add_space_member(:person, :default_space)
      |> Factory.log_in_person(:person)
    end

    test "project discussion subscriptions use the message while activity threads have their own type", ctx do
      ctx = Factory.add_project_discussion(ctx, :discussion, :project1)
      target = %{resource_id: Paths.message_id(ctx.discussion), resource_type: "project_discussion"}

      assert {200, %{subscribed: false}} = query(ctx.conn, [:notifications, :is_subscribed], target)
      assert {404, _} = query(ctx.conn, [:notifications, :is_subscribed], %{target | resource_type: "comment_thread"})

      ctx = Factory.add_api_token(ctx, :token, :person, read_only: true)
      assert {200, %{subscribed: false}} = external_query(ctx.conn, ctx.token, "notifications/is_subscribed", %{target | resource_type: "comment_thread"})
    end

    test "can read a goal thread subscription from before threads stored a parent ID", ctx do
      ctx = Factory.add_goal_discussion(ctx, :discussion, :goal1)
      thread = ctx.discussion
      Repo.update_all(from(t in Operately.Comments.CommentThread, where: t.id == ^thread.id), set: [parent_id: nil, parent_type: nil])

      assert {200, %{subscribed: false}} = query(ctx.conn, [:notifications, :is_subscribed], %{resource_id: Paths.comment_thread_id(thread), resource_type: "comment_thread"})
    end

    test "returns false when user is not subscribed to goal update", ctx do
      assert {200, res} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: Paths.goal_update_id(ctx.update1),
        resource_type: "goal_update"
      })

      assert res.subscribed == false
    end

    test "returns true when user is subscribed to goal update", ctx do
      Factory.add_subscription(ctx, :sub1, :update1, person: ctx.person, type: :joined)

      assert {200, res} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: Paths.goal_update_id(ctx.update1),
        resource_type: "goal_update"
      })

      assert res.subscribed == true
    end

    test "returns false when subscription is canceled", ctx do
      Factory.add_subscription(ctx, :sub1, :update1, person: ctx.person, type: :joined, canceled: true)

      assert {200, res} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: Paths.goal_update_id(ctx.update1),
        resource_type: "goal_update"
      })

      assert res.subscribed == false
    end

    test "returns false when user is not subscribed to project check-in", ctx do
      assert {200, res} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: Paths.project_check_in_id(ctx.check_in1),
        resource_type: "project_check_in"
      })

      assert res.subscribed == false
    end

    test "returns true when user is subscribed to project check-in", ctx do
      Factory.add_subscription(ctx, :sub1, :check_in1, person: ctx.person, type: :mentioned)

      assert {200, res} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: Paths.project_check_in_id(ctx.check_in1),
        resource_type: "project_check_in"
      })

      assert res.subscribed == true
    end

    test "returns false when user is not subscribed to message", ctx do
      assert {200, res} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: Paths.message_id(ctx.message1),
        resource_type: "message"
      })

      assert res.subscribed == false
    end

    test "returns true when user is subscribed to message", ctx do
      Factory.add_subscription(ctx, :sub1, :message1, person: ctx.person, type: :invited)

      assert {200, res} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: Paths.message_id(ctx.message1),
        resource_type: "message"
      })

      assert res.subscribed == true
    end

    test "returns true when user is subscribed to a space task", ctx do
      Factory.add_subscription(ctx, :sub1, :space_task1, person: ctx.person, type: :joined)

      assert {200, res} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: Paths.task_id(ctx.space_task1),
        resource_type: "space_task"
      })

      assert res.subscribed == true
    end

    test "returns true when user is subscribed to a kpi", ctx do
      Factory.add_subscription(ctx, :sub1, :kpi1, person: ctx.person, type: :joined)

      assert {200, res} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: Paths.kpi_id(ctx.kpi1),
        resource_type: "kpi"
      })

      assert res.subscribed == true
    end

    test "returns 400 for invalid resource type", ctx do
      assert {400, _} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: Paths.goal_update_id(ctx.update1),
        resource_type: "invalid_type"
      })
    end

    test "returns 404 for non-existent resource", ctx do
      assert {404, _} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: Paths.goal_update_id(%{id: Ecto.UUID.generate(), inserted_at: DateTime.utc_now()}),
        resource_type: "goal_update"
      })
    end

    test "subscription type doesn't matter, only canceled status", ctx do
      Factory.add_subscription(ctx, :sub1, :update1, person: ctx.person, type: :invited)

      assert {200, res} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: Paths.goal_update_id(ctx.update1),
        resource_type: "goal_update"
      })

      assert res.subscribed == true
    end

    test "returns true when user is subscribed to project check-in with different subscription type", ctx do
      Factory.add_subscription(ctx, :sub1, :check_in1, person: ctx.person, type: :invited)

      assert {200, res} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: Paths.project_check_in_id(ctx.check_in1),
        resource_type: "project_check_in"
      })

      assert res.subscribed == true
    end

    test "returns true when user is subscribed to message with different subscription type", ctx do
      Factory.add_subscription(ctx, :sub1, :message1, person: ctx.person, type: :mentioned)

      assert {200, res} = query(ctx.conn, [:notifications, :is_subscribed], %{
        resource_id: Paths.message_id(ctx.message1),
        resource_type: "message"
      })

      assert res.subscribed == true
    end
  end
end
