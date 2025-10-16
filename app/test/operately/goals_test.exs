defmodule Operately.GoalsTest do
  use Operately.DataCase

  alias Operately.{Goals, Projects, Updates}
  alias Operately.Goals.Goal
  alias Operately.Access.Binding

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.CompaniesFixtures
  import Operately.GoalsFixtures

  setup do
    company = company_fixture()
    person = person_fixture(%{company_id: company.id})
    group = group_fixture(person, %{company_id: company.id})
    goal = goal_fixture(person, %{space_id: group.id, targets: []})

    %{goal: goal, person: person, group: group, company: company}
  end

  describe "goals" do
    test "list_goals/0 returns all goals", ctx do
      assert Goals.list_goals() == [ctx.goal]
    end

    test "get_goal!/1 returns the goal with given id", ctx do
      assert Goals.get_goal!(ctx.goal.id) == ctx.goal
    end

    test "create_goal/2 with valid data creates a goal", ctx do
      valid_attrs = %{
        name: "some name",
        space_id: ctx.group.id,
        champion_id: ctx.person.id,
        reviewer_id: ctx.person.id,
        timeframe: %{
          start_date: ~D[2020-01-01],
          end_date: ~D[2020-12-31],
          type: "year"
        },
        company_access_level: Binding.comment_access(),
        space_access_level: Binding.edit_access(),
        anonymous_access_level: Binding.view_access()
      }

      assert {:ok, %Goal{} = goal} = Goals.create_goal(ctx.person, valid_attrs)
      assert goal.name == "some name"
    end

    test "create_goal/2 with invalid data returns error changeset", ctx do
      assert {:error, :goal, %Ecto.Changeset{}, _} =
               Goals.create_goal(ctx.person, %{
                 space_id: ctx.group.id,
                 champion_id: ctx.person.id,
                 reviewer_id: ctx.person.id,
                 company_access_level: Binding.comment_access(),
                 space_access_level: Binding.edit_access(),
                 anonymous_access_level: Binding.view_access()
               })
    end

    test "update_goal/2 with valid data updates the goal", ctx do
      update_attrs = %{name: "some updated name"}

      assert {:ok, %Goal{} = goal} = Goals.update_goal(ctx.goal, update_attrs)
      assert goal.name == "some updated name"
    end

    test "update_goal/2 with invalid data returns error changeset", ctx do
      assert {:error, %Ecto.Changeset{}} =
               Goals.update_goal(ctx.goal, %{
                 name: nil
               })

      assert ctx.goal == Goals.get_goal!(ctx.goal.id)
    end

    test "change_goal/1 returns a goal changeset", ctx do
      assert %Ecto.Changeset{} = Goals.change_goal(ctx.goal)
    end
  end

  describe "goal deletion" do
    setup ctx do
      ctx
      |> Factory.add_company_admin(:creator)
    end

    test "given goal has child project, it cannot be deleted", ctx do
      Factory.add_project(ctx, :project, :group, goal: :goal)

      assert_raise Ecto.ConstraintError, ~r/projects_goal_id_fkey/, fn ->
        Goals.delete_goal(ctx.goal)
      end
    end

    test "given child goal and project are deleted first, goal can be deleted", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:child_goal, :group, parent_goal: :goal)
        |> Factory.add_project(:child_project, :group, goal: :goal)

      {:ok, _} = Goals.delete_goal(ctx.child_goal)
      {:ok, _} = Projects.delete_project(ctx.child_project)

      {:ok, _} = Goals.delete_goal(ctx.goal)

      refute Projects.get_project(ctx.child_project.id)
      refute Goals.get_goal(ctx.child_goal.id)
      refute Goals.get_goal(ctx.goal.id)
    end

    test "when goal is deleted, its targets are also deleted", ctx do
      ctx = Factory.add_goal_target(ctx, :target, :goal)

      assert length(Goals.list_targets(ctx.goal.id)) == 1

      {:ok, _} = Goals.delete_goal(ctx.goal)
      refute Goals.get_target(ctx.target.id)
    end

    test "when goal is deleted, its check-ins are also deleted", ctx do
      ctx =
        ctx
        |> Factory.add_goal_update(:check_in1, :goal, :creator)
        |> Factory.add_goal_update(:check_in2, :goal, :creator)

      {:ok, _} = Goals.delete_goal(ctx.goal)
    end

    test "when goal is deleted, its discussions are also deleted", ctx do
      ctx =
        ctx
        |> Factory.add_goal_discussion(:discussion, :goal)
        |> Factory.close_goal(:goal)
        |> Factory.reopen_goal(:goal)

      assert length(Goals.list_goal_discussions(ctx.goal.id)) == 3

      {:ok, _} = Goals.delete_goal(ctx.goal)

      assert length(Goals.list_goal_discussions(ctx.goal.id)) == 0
    end

    test "when goal is deleted, its discussions' and check-ins' comments are also deleted", ctx do
      ctx =
        ctx
        |> Factory.add_goal_discussion(:discussion, :goal)
        |> Factory.add_goal_update(:check_in, :goal, :creator)
        |> Factory.preload(:check_in, :goal)
        |> Factory.add_comment(:comment1, :discussion)
        |> Factory.add_comment(:comment2, :discussion)
        |> Factory.add_comment(:comment3, :check_in)
        |> Factory.add_comment(:comment4, :check_in)

      assert length(Updates.list_comments(ctx.discussion.id, :comment_thread)) == 2
      assert length(Updates.list_comments(ctx.check_in.id, :goal_update)) == 2

      {:ok, _} = Goals.delete_goal(ctx.goal)

      assert length(Updates.list_comments(ctx.discussion.id, :comment_thread)) == 0
      assert length(Updates.list_comments(ctx.check_in.id, :goal_update)) == 0
    end

    test "when goal is deleted, its discussions', check-ins', comments' and reactions are also deleted", ctx do
      ctx =
        ctx
        |> Factory.add_goal_discussion(:discussion, :goal)
        |> Factory.add_goal_update(:check_in, :goal, :creator)
        |> Factory.add_comment(:comment, :discussion)
        |> Factory.add_reactions(:reaction1, :discussion)
        |> Factory.add_reactions(:reaction2, :check_in)
        |> Factory.add_reactions(:reaction3, :comment)

      assert length(Operately.Updates.list_reactions(ctx.discussion.id, :comment_thread)) == 1
      assert length(Operately.Updates.list_reactions(ctx.check_in.id, :goal_update)) == 1
      assert length(Operately.Updates.list_reactions(ctx.comment.id, :comment)) == 1

      {:ok, _} = Goals.delete_goal(ctx.goal)

      assert length(Operately.Updates.list_reactions(ctx.discussion.id, :comment_thread)) == 0
      assert length(Operately.Updates.list_reactions(ctx.check_in.id, :goal_update)) == 0
      assert length(Operately.Updates.list_reactions(ctx.comment.id, :comment)) == 0
    end
  end
end
