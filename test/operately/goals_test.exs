defmodule Operately.GoalsTest do
  use Operately.DataCase

  alias Operately.Goals
  alias Operately.Goals.Goal

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
        timeframe: "2023-Q1"
      }

      assert {:ok, %Goal{} = goal} = Goals.create_goal(ctx.person, valid_attrs)
      assert goal.name == "some name"
    end

    test "create_goal/2 with invalid data returns error changeset", ctx do
      assert {:error, :goal, %Ecto.Changeset{}, _} = Goals.create_goal(ctx.person, %{
        space_id: ctx.group.id,
      })
    end

    test "update_goal/2 with valid data updates the goal", ctx do
      update_attrs = %{name: "some updated name"}

      assert {:ok, %Goal{} = goal} = Goals.update_goal(ctx.goal, update_attrs)
      assert goal.name == "some updated name"
    end

    test "update_goal/2 with invalid data returns error changeset", ctx do
      assert {:error, %Ecto.Changeset{}} = Goals.update_goal(ctx.goal, %{
        name: nil
      })

      assert ctx.goal == Goals.get_goal!(ctx.goal.id)
    end

    test "change_goal/1 returns a goal changeset", ctx do
      assert %Ecto.Changeset{} = Goals.change_goal(ctx.goal)
    end
  end
end
