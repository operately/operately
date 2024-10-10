defmodule OperatelyWeb.Api.Mutations.CreateCommentTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 2]
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.GoalsFixtures
  import Operately.CommentsFixtures
  import Operately.MessagesFixtures

  alias Operately.{Notifications, Updates}
  alias Operately.Notifications.SubscriptionList
  alias Operately.Activities.Activity
  alias Operately.Access.Binding
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :create_comment, %{})
    end
  end

  describe "permissions" do
    @project_table [
      %{company: :no_access,      space: :no_access,      project: :no_access,      expected: 404},
      %{company: :no_access,      space: :no_access,      project: :view_access,    expected: 403},
      %{company: :no_access,      space: :no_access,      project: :comment_access, expected: 200},
      %{company: :no_access,      space: :no_access,      project: :edit_access,    expected: 200},
      %{company: :no_access,      space: :no_access,      project: :full_access,    expected: 200},

      %{company: :no_access,      space: :view_access,    project: :no_access,      expected: 403},
      %{company: :no_access,      space: :comment_access, project: :no_access,      expected: 200},
      %{company: :no_access,      space: :edit_access,    project: :no_access,      expected: 200},
      %{company: :no_access,      space: :full_access,    project: :no_access,      expected: 200},

      %{company: :view_access,    space: :no_access,      project: :no_access,      expected: 403},
      %{company: :comment_access, space: :no_access,      project: :no_access,      expected: 200},
      %{company: :edit_access,    space: :no_access,      project: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      project: :no_access,      expected: 200},
    ]

    @goal_table [
      %{company: :no_access,      space: :no_access,      goal: :no_access,      expected: 404},
      %{company: :no_access,      space: :no_access,      goal: :champion,       expected: 200},
      %{company: :no_access,      space: :no_access,      goal: :reviewer,       expected: 200},

      %{company: :no_access,      space: :view_access,    goal: :no_access,      expected: 403},
      %{company: :no_access,      space: :comment_access, goal: :no_access,      expected: 200},
      %{company: :no_access,      space: :edit_access,    goal: :no_access,      expected: 200},
      %{company: :no_access,      space: :full_access,    goal: :no_access,      expected: 200},

      %{company: :view_access,    space: :no_access,      goal: :no_access,      expected: 403},
      %{company: :comment_access, space: :no_access,      goal: :no_access,      expected: 200},
      %{company: :edit_access,    space: :no_access,      goal: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      goal: :no_access,      expected: 200},
    ]

    @space_table [
      %{company: :no_access,      space: :no_access,      expected: 404},
      %{company: :no_access,      space: :view_access,    expected: 403},
      %{company: :no_access,      space: :comment_access, expected: 200},
      %{company: :no_access,      space: :edit_access,    expected: 200},
      %{company: :no_access,      space: :full_access,    expected: 200},

      %{company: :view_access,    space: :no_access,      expected: 403},
      %{company: :comment_access, space: :no_access,      expected: 200},
      %{company: :edit_access,    space: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @project_table do
      test "project check-in - if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        check_in = create_check_in(ctx.creator, project)

        assert {code, res} = mutation(ctx.conn, :create_comment, %{
          entity_id: Paths.project_check_in_id(check_in),
          entity_type: "project_check_in",
          content: RichText.rich_text("Content", :as_string)
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert Updates.count_comments(check_in.id, :project_check_in) == 1
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @project_table do
      test "project retrospective - if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        retrospective = retrospective_fixture(%{project_id: project.id, author_id: ctx.creator.id})

        assert {code, res} = mutation(ctx.conn, :create_comment, %{
          entity_id: Paths.project_retrospective_id(retrospective),
          entity_type: "project_retrospective",
          content: RichText.rich_text("Content", :as_string)
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert Updates.count_comments(retrospective.id, :project_retrospective) == 1
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @goal_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the comment thread, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)
        thread = create_comment_thread(goal)

        assert {code, res} = mutation(ctx.conn, :create_comment, %{
          entity_id: Paths.comment_thread_id(thread),
          entity_type: "comment_thread",
          content: RichText.rich_text("Content", :as_string)
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert Updates.count_comments(thread.id, :comment_thread) == 1
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

        assert {code, res} = mutation(ctx.conn, :create_comment, %{
          entity_id: Paths.goal_update_id(update),
          entity_type: "goal_update",
          content: RichText.rich_text("Content", :as_string)
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert Updates.count_comments(update.id, :goal_update) == 1
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @space_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space} on the space, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx, @test.company, @test.space)
        message = message_fixture(ctx.creator.id, space.id)

        assert {code, res} = mutation(ctx.conn, :create_comment, %{
          entity_id: Paths.message_id(message),
          entity_type: "message",
          content: RichText.rich_text("Content", :as_string)
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert Updates.count_comments(message.id, :message) == 1
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "create_comment functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      project = project_fixture(%{company_id: ctx.company.id, creator_id: ctx.person.id, group_id: ctx.company.company_space_id})
      check_in = create_check_in(ctx.person, project)

      Map.merge(ctx, %{check_in: check_in})
    end

    test "creates comment", ctx do
      assert Updates.count_comments(ctx.check_in.id, :project_check_in) == 0

      assert {200, res} = mutation(ctx.conn, :create_comment, %{
        entity_id: Paths.project_check_in_id(ctx.check_in),
        entity_type: "project_check_in",
        content: RichText.rich_text("Content", :as_string)
      })

      assert Updates.count_comments(ctx.check_in.id, :project_check_in) == 1

      comment = hd(Updates.list_comments(ctx.check_in.id, :project_check_in))
      assert res.comment == Serializer.serialize(comment, level: :essential)
    end

    test "updates subscriptions list", ctx do
      people = Enum.map(1..3, fn _ ->
        person_fixture(%{company_id: ctx.company.id})
      end)
      content = RichText.rich_text(mentioned_people: people)

      {:ok, list} = SubscriptionList.get(:system, parent_id: ctx.check_in.id, opts: [
        preload: :subscriptions
      ])
      assert list.subscriptions == []

      assert {200, _} = mutation(ctx.conn, :create_comment, %{
        entity_id: Paths.project_check_in_id(ctx.check_in),
        entity_type: "project_check_in",
        content: content
      })

      {:ok, list} = SubscriptionList.get(:system, parent_id: ctx.check_in.id, opts: [
        preload: :subscriptions
      ])

      assert length(list.subscriptions) == 3

      Enum.each(list.subscriptions, fn s ->
        assert Enum.find(people, &(&1.id == s.person_id))
      end)
    end

    test "doesn't create repeated subscriptions", ctx do
      another_person = person_fixture(%{company_id: ctx.company.id})
      {:ok, list} = SubscriptionList.get(:system, parent_id: ctx.check_in.id)
      Notifications.create_subscription(%{
        subscription_list_id: list.id,
        person_id: ctx.person.id,
        type: :joined,
      })
      subscriptions = Notifications.list_subscriptions(list)

      assert length(subscriptions) == 1
      assert hd(subscriptions).person_id == ctx.person.id

      assert {200, _} = mutation(ctx.conn, :create_comment, %{
        entity_id: Paths.project_check_in_id(ctx.check_in),
        entity_type: "project_check_in",
        content: RichText.rich_text(mentioned_people: [ctx.person, another_person])
      })

      subscriptions = Notifications.list_subscriptions(list)

      assert length(subscriptions) == 2
      assert Enum.find(subscriptions, &(&1.person_id == another_person.id))
      assert Enum.find(subscriptions, &(&1.person_id == ctx.person.id))
    end
  end

  #
  # Helpers
  #

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

  def create_check_in(author, project) do
    check_in_fixture(%{author_id: author.id, project_id: project.id})
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
  end
end
