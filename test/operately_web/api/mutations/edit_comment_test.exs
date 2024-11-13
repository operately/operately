defmodule OperatelyWeb.Api.Mutations.EditCommentTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 2]
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.GoalsFixtures
  import Operately.CommentsFixtures
  import Operately.MessagesFixtures

  alias Operately.Notifications
  alias Operately.Notifications.SubscriptionList
  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_comment, %{})
    end
  end

  describe "permissions" do
    @project_table [
      %{company: :no_access,      space: :no_access,      project: :no_access,      expected: 404},
      %{company: :no_access,      space: :no_access,      project: :view_access,    expected: 403},
      %{company: :no_access,      space: :no_access,      project: :comment_access, expected: 403},
      %{company: :no_access,      space: :no_access,      project: :edit_access,    expected: 403},
      %{company: :no_access,      space: :no_access,      project: :full_access,    expected: 403},

      %{company: :no_access,      space: :view_access,    project: :no_access,      expected: 403},
      %{company: :no_access,      space: :comment_access, project: :no_access,      expected: 403},
      %{company: :no_access,      space: :edit_access,    project: :no_access,      expected: 403},
      %{company: :no_access,      space: :full_access,    project: :no_access,      expected: 403},

      %{company: :view_access,    space: :no_access,      project: :no_access,      expected: 403},
      %{company: :comment_access, space: :no_access,      project: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      project: :no_access,      expected: 403},
      %{company: :full_access,    space: :no_access,      project: :no_access,      expected: 403},
    ]

    @goal_table [
      %{company: :no_access,      space: :no_access,      goal: :no_access,      expected: 404},
      %{company: :no_access,      space: :no_access,      goal: :champion,       expected: 403},
      %{company: :no_access,      space: :no_access,      goal: :reviewer,       expected: 403},

      %{company: :no_access,      space: :view_access,    goal: :no_access,      expected: 403},
      %{company: :no_access,      space: :comment_access, goal: :no_access,      expected: 403},
      %{company: :no_access,      space: :edit_access,    goal: :no_access,      expected: 403},
      %{company: :no_access,      space: :full_access,    goal: :no_access,      expected: 403},

      %{company: :view_access,    space: :no_access,      goal: :no_access,      expected: 403},
      %{company: :comment_access, space: :no_access,      goal: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      goal: :no_access,      expected: 403},
      %{company: :full_access,    space: :no_access,      goal: :no_access,      expected: 403},
    ]

    @space_table [
      %{company: :no_access,      space: :no_access,      expected: 404},
      %{company: :no_access,      space: :view_access,    expected: 403},
      %{company: :no_access,      space: :comment_access, expected: 403},
      %{company: :no_access,      space: :edit_access,    expected: 403},
      %{company: :no_access,      space: :full_access,    expected: 403},

      %{company: :view_access,    space: :no_access,      expected: 403},
      %{company: :comment_access, space: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      expected: 403},
      %{company: :full_access,    space: :no_access,      expected: 403},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @project_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        check_in = create_check_in(ctx.creator, project)
        comment = create_comment(ctx, check_in, "project_check_in")

        assert {code, res} = mutation(ctx.conn, :edit_comment, %{
          comment_id: Paths.comment_id(comment),
          content: RichText.rich_text("New content", :as_string),
          parent_type: "project_check_in",
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            comment = Repo.reload(comment)
            assert res.comment == Serializer.serialize(comment, level: :essential)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @goal_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the thread, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)
        thread = create_comment_thread(goal)
        comment = create_comment(ctx, thread, "comment_thread")

        assert {code, res} = mutation(ctx.conn, :edit_comment, %{
          comment_id: Paths.comment_id(comment),
          content: RichText.rich_text("New content", :as_string),
          parent_type: "comment_thread",
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            comment = Repo.reload(comment)
            assert res.comment == Serializer.serialize(comment, level: :essential)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @goal_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)
        update = create_goal_update(ctx, goal)
        comment = create_comment(ctx, update, "update")

        assert {code, res} = mutation(ctx.conn, :edit_comment, %{
          comment_id: Paths.comment_id(comment),
          content: RichText.rich_text("New content", :as_string),
          parent_type: "goal_update",
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            comment = Repo.reload(comment)
            assert res.comment == Serializer.serialize(comment, level: :essential)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @space_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space} on the space, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx, @test.company, @test.space)
        board = messages_board_fixture(space.id)
        message = message_fixture(ctx.creator.id, board.id) |> Repo.preload(:space)
        comment = create_comment(ctx, message, "message")

        assert {code, res} = mutation(ctx.conn, :edit_comment, %{
          comment_id: Paths.comment_id(comment),
          content: RichText.rich_text("New content", :as_string),
          parent_type: "message",
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            comment = Repo.reload(comment)
            assert res.comment == Serializer.serialize(comment, level: :essential)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @project_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the milestone comment, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        milestone = milestone_fixture(ctx.creator, %{project_id: project.id})
        comment = create_milestone_comment(ctx, milestone)

        assert {code, res} = mutation(ctx.conn, :edit_comment, %{
          comment_id: Paths.comment_id(comment),
          content: RichText.rich_text("New content", :as_string),
          parent_type: "milestone",
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            comment = Repo.reload(comment)
            assert res.comment == Serializer.serialize(comment, level: :essential)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "edit_comment functionality" do
    setup :register_and_log_in_account

    test "edits comment", ctx do
      project = project_fixture(%{company_id: ctx.company.id, creator_id: ctx.person.id, group_id: ctx.company.company_space_id})
      check_in = create_check_in(ctx.person, project)
      {:ok, comment} = Operately.Operations.CommentAdding.run(ctx.person, check_in, "project_check_in", RichText.rich_text("Content"))

      assert comment.content["message"] == RichText.rich_text("Content")

      assert {200, res} = mutation(ctx.conn, :edit_comment, %{
        comment_id: Paths.comment_id(comment),
        content: RichText.rich_text("New content", :as_string),
        parent_type: "project_check_in",
      })

      comment = Repo.reload(comment)
      assert res.comment == Serializer.serialize(comment, level: :essential)
    end
  end

  describe "Updates subscriptions" do
    @table [
      %{resource: :check_in,      resource_type: "project_check_in"},
      %{resource: :retrospective, resource_type: "project_retrospective"},
      %{resource: :update,        resource_type: "goal_update"},
      %{resource: :message,       resource_type: "message"},
    ]

    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:person, :space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_check_in(:check_in, :project, :creator)
      |> Factory.preload(:check_in, :project)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_retrospective(:retrospective, :project, :creator)
      |> Factory.preload(:retrospective, :project)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal_update(:update, :goal, :creator)
      |> Factory.preload(:update, :goal)
      |> Factory.add_messages_board(:messages_board, :space)
      |> Factory.add_message(:message, :messages_board)
      |> Factory.preload(:message, :space)
    end

    tabletest @table do
      test "#{@test.resource_type}", ctx do
        comment = create_comment(ctx, ctx[@test.resource], @test.resource_type)
        {:ok, list} = SubscriptionList.get(:system, parent_id: ctx[@test.resource].id, opts: [
          preload: :subscriptions
        ])

        subscriptions = Enum.filter(list.subscriptions, &(&1.person_id != ctx.creator.id))
        assert subscriptions == []

        assert {200, _} = mutation(ctx.conn, :edit_comment, %{
          comment_id: Paths.comment_id(comment),
          content: RichText.rich_text(mentioned_people: [ctx.person]),
          parent_type: @test.resource_type,
        })

        subscriptions =
          Notifications.list_subscriptions(list)
          |> Enum.filter(&(&1.person_id != ctx.creator.id))

        assert length(subscriptions) == 1
        assert hd(subscriptions).person_id == ctx.person.id
      end
    end
  end

  #
  # Helpers
  #

  defp create_comment(ctx, parent, type) do
    {:ok, comment} = Operately.Operations.CommentAdding.run(ctx.creator, parent, type, RichText.rich_text("Content"))
    comment
  end

  def create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  def create_space(ctx, company_members_level, space_members_level) do
    space = group_fixture(ctx.creator, %{
      company_id: ctx.company.id,
      company_permissions: Binding.from_atom(company_members_level),
    })

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    space
  end

  defp create_check_in(author, project) do
    check_in_fixture(%{author_id: author.id, project_id: project.id})
    |> Repo.preload(:project)
  end

  def create_project(ctx, space, company_members_level, space_members_level, project_member_level) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.creator.id,
      group_id: space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    })

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    if project_member_level != :no_access do
      {:ok, _} = Operately.Projects.create_contributor(ctx.creator, %{
        project_id: project.id,
        person_id: ctx.person.id,
        permissions: Binding.from_atom(project_member_level),
        responsibility: "some responsibility"
      })
    end

    project
  end

  def create_goal(ctx, space, company_members_level, space_members_level, goal_member_level) do
    attrs = case goal_member_level do
      :champion -> [champion_id: ctx.person.id]
      :reviewer -> [reviewer_id: ctx.person.id]
      _ -> []
    end

    goal = goal_fixture(ctx.creator, Enum.into(attrs, %{
      space_id: space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    }))

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    goal
  end

  defp create_comment_thread(goal) do
    activity = from(a in Activity, where: a.action == "goal_created" and a.content["goal_id"] == ^goal.id) |> Repo.one!()
    comment_thread_fixture(%{parent_id: activity.id})
  end

  defp create_goal_update(ctx, goal) do
    goal_update_fixture(ctx.creator, goal)
    |> Repo.preload(:goal)
  end

  defp create_milestone_comment(ctx, milestone) do
    {:ok, milestone_comment} = Operately.Comments.create_milestone_comment(
      ctx.creator,
      milestone,
      "none",
      %{
        content: %{"message" => RichText.rich_text("Content")},
        author_id: ctx.creator.id,
      }
    )
    Operately.Updates.get_comment!(milestone_comment.comment_id)
  end
end
