defmodule OperatelyWeb.Api.Mutations.AddReactionTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 2]
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.GoalsFixtures
  import Operately.CommentsFixtures
  import Operately.MessagesFixtures

  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :add_reaction, %{})
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

        assert {code, res} = mutation(ctx.conn, :add_reaction, %{
          entity_id: Paths.project_check_in_id(check_in),
          entity_type: "project_check_in",
          emoji: "👍"
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            reaction = get_reaction(check_in.id, :project_check_in)
            assert res.reaction == Serializer.serialize(reaction, level: :essential)
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

        assert {code, res} = mutation(ctx.conn, :add_reaction, %{
          entity_id: Paths.project_retrospective_id(retrospective),
          entity_type: "project_retrospective",
          emoji: "👍"
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            reaction = get_reaction(retrospective.id, :project_retrospective)
            assert res.reaction == Serializer.serialize(reaction, level: :essential)
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

        assert {code, res} = mutation(ctx.conn, :add_reaction, %{
          entity_id: Paths.comment_thread_id(thread),
          entity_type: "comment_thread",
          emoji: "👍"
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            reaction = get_reaction(thread.id, :comment_thread)
            assert res.reaction == Serializer.serialize(reaction, level: :essential)
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

        assert {code, res} = mutation(ctx.conn, :add_reaction, %{
          entity_id: Paths.goal_update_id(update),
          entity_type: "goal_update",
          emoji: "👍"
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            reaction = get_reaction(update.id, :goal_update)
            assert res.reaction == Serializer.serialize(reaction, level: :essential)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @space_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space} on the space, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx, @test.company, @test.space)
        message = message_fixture(ctx.creator.id, space.id)

        assert {code, res} = mutation(ctx.conn, :add_reaction, %{
          entity_id: Paths.message_id(message),
          entity_type: "message",
          emoji: "👍"
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            reaction = get_reaction(message.id, :message)
            assert res.reaction == Serializer.serialize(reaction, level: :essential)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @project_table do
      test "project check-in comment - if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        check_in = create_check_in(ctx.creator, project)
        comment = create_comment(ctx, check_in, "project_check_in")

        assert {code, res} = mutation(ctx.conn, :add_reaction, %{
          entity_id: Paths.comment_id(comment),
          entity_type: "comment",
          parent_type: "project_check_in",
          emoji: "👍"
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            reaction = get_reaction(comment.id, :comment)
            assert res.reaction == Serializer.serialize(reaction, level: :essential)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @project_table do
      test "project retrospective comment - if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        retrospective = retrospective_fixture(%{project_id: project.id, author_id: ctx.creator.id}) |> Repo.preload(:project)
        comment = create_comment(ctx, retrospective, "project_retrospective")

        assert {code, res} = mutation(ctx.conn, :add_reaction, %{
          entity_id: Paths.comment_id(comment),
          entity_type: "comment",
          parent_type: "project_retrospective",
          emoji: "👍"
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            reaction = get_reaction(comment.id, :comment)
            assert res.reaction == Serializer.serialize(reaction, level: :essential)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @project_table do
      test "project milestone comment - if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        milestone = milestone_fixture(ctx.creator, %{project_id: project.id})
        comment = create_milestone_comment(ctx, milestone)

        assert {code, res} = mutation(ctx.conn, :add_reaction, %{
          entity_id: Paths.comment_id(comment),
          entity_type: "comment",
          parent_type: "milestone",
          emoji: "👍"
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            reaction = get_reaction(comment.id, :comment)
            assert res.reaction == Serializer.serialize(reaction, level: :essential)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @goal_table do
      test "goal discussion comment - if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)
        thread = create_comment_thread(goal)
        comment = create_comment(ctx, thread, "comment_thread")

        assert {code, res} = mutation(ctx.conn, :add_reaction, %{
          entity_id: Paths.comment_id(comment),
          entity_type: "comment",
          parent_type: "comment_thread",
          emoji: "👍"
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            reaction = get_reaction(comment.id, :comment)
            assert res.reaction == Serializer.serialize(reaction, level: :essential)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @goal_table do
      test "goal update comment - if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)
        update = create_goal_update(ctx, goal)
        comment = create_comment(ctx, update, "update")

        assert {code, res} = mutation(ctx.conn, :add_reaction, %{
          entity_id: Paths.comment_id(comment),
          entity_type: "comment",
          parent_type: "goal_update",
          emoji: "👍"
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            reaction = get_reaction(comment.id, :comment)
            assert res.reaction == Serializer.serialize(reaction, level: :essential)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @space_table do
      test "message comment - if caller has levels company=#{@test.company}, space=#{@test.space} on the space, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx, @test.company, @test.space)
        message = message_fixture(ctx.creator.id, space.id)
        comment = create_comment(ctx, message, "message")

        assert {code, res} = mutation(ctx.conn, :add_reaction, %{
          entity_id: Paths.comment_id(comment),
          entity_type: "comment",
          parent_type: "message",
          emoji: "👍"
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            reaction = get_reaction(comment.id, :comment)
            assert res.reaction == Serializer.serialize(reaction, level: :essential)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "add_reaction functionality" do
    setup :register_and_log_in_account

    test "add reaction to a discussion", ctx do
      Operately.Companies.add_admin(ctx.company_creator, ctx.person.id)
      message = message_fixture(ctx.person.id, ctx.company.company_space_id)

      assert {200, res} = mutation(ctx.conn, :add_reaction, %{
        entity_id: Paths.message_id(message),
        entity_type: "message",
        emoji: "👍"
      })

      reaction = hd(Operately.Updates.list_reactions(message.id, :message))
      assert reaction.emoji == "👍"
      assert res.reaction == Serializer.serialize(reaction, level: :essential)
    end
  end

  #
  # Helpers
  #

  defp get_reaction(id, type) do
    hd(Operately.Updates.list_reactions(id, type))
  end

  def create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  defp create_space(ctx, company_members_level, space_members_level) do
    space = group_fixture(ctx.creator, %{
      company_id: ctx.company.id,
      company_permissions: Binding.from_atom(company_members_level),
    })

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        permissions: Binding.from_atom(space_members_level)
      }])
    end

    space
  end

  defp create_project(ctx, space, company_members_level, space_members_level, project_member_level) do
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
        permissions: Binding.from_atom(space_members_level)
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

  defp create_goal(ctx, space, company_members_level, space_members_level, goal_member_level) do
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
        permissions: Binding.from_atom(space_members_level)
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

  defp create_check_in(author, project) do
    check_in_fixture(%{author_id: author.id, project_id: project.id})
  end

  defp create_comment(ctx, parent, type) do
    {:ok, comment} = Operately.Operations.CommentAdding.run(ctx.creator, parent, type, RichText.rich_text("Content"))
    comment
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
