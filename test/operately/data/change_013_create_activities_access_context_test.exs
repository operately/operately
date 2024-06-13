defmodule Operately.Data.Change013CreateActivitiesAccessContextTest do
  use Operately.DataCase

  import Operately.AccessFixtures, only: [context_fixture: 1]
  import Operately.CompaniesFixtures
  import Operately.ActivitiesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures
  import Operately.GoalsFixtures

  alias Operately.Data.Change013CreateActivitiesAccessContext

  setup do
    company = company_fixture()
    context_fixture(%{company_id: company.id})
    company = Repo.preload(company, :access_context)

    author = person_fixture_with_account(%{company_id: company.id})

    {:ok, company: company, author: author}
  end

  describe "creates access_context for company activities" do
    test "company_member_removed action", ctx do
      attrs = %{
        action: "company_member_removed",
        author_id: ctx.author.id,
        content: %{
          company_id: ctx.company.id,
          name: "",
          email: "",
          title: "",
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.company.access_context.id)
    end
  end

  describe "creates access_context for space activities" do
    setup ctx do
      group = group_fixture(ctx.author)
      context_fixture(%{group_id: group.id})
      group = Repo.preload(group, :access_context)

      Map.merge(ctx, %{group: group})
    end

    test "group_edited action", ctx do
      attrs = %{
        action: "group_edited",
        author_id: ctx.author.id,
        content: %{
          company_id: ctx.company.id,
          group_id: ctx.group.id,
          old_name: "",
          old_mission: "",
          new_name: "",
          new_mission: "",
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "goal_reparent action", ctx do
      attrs = %{
        action: "goal_reparent",
        author_id: ctx.author.id,
        content: %{
          company_id: ctx.company.id,
          new_parent_goal_id: ctx.group.id,
          old_parent_goal_id: "",
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "space_joining action", ctx do
      attrs = %{
        action: "space_joining",
        author_id: ctx.author.id,
        content: %{
          company_id: ctx.company.id,
          space_id: ctx.group.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.group.access_context.id)
    end
  end

  describe "creates access_context for goal activities" do
    setup ctx do
      group = group_fixture(ctx.author)

      goal = goal_fixture(ctx.author, %{space_id: group.id, targets: []})
      context_fixture(%{goal_id: goal.id})
      goal = Repo.preload(goal, :access_context)

      Map.merge(ctx, %{goal: goal})
    end

    test "goal_check_in action", ctx do
      attrs = %{
        action: "goal_check_in",
        author_id: ctx.author.id,
        content: %{
          company_id: ctx.company.id,
          goal_id: ctx.goal.id,
          update_id: "",
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.goal.access_context.id)
    end
  end

  describe "creates access_context for project activities" do
    setup ctx do
      group = group_fixture(ctx.author)
      project = project_fixture(%{company_id: ctx.company.id, group_id: group.id, creator_id: ctx.author.id})
      project = Repo.preload(project, :access_context)

      Map.merge(ctx, %{project: project})
    end

    test "project_created action", ctx do
      attrs = %{
        action: "project_created",
        author_id: ctx.author.id,
        content: %{
          company_id: ctx.company.id,
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_archived action", ctx do
      attrs = %{
        action: "project_archived",
        author_id: ctx.author.id,
        content: %{
          company_id: ctx.company.id,
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end
  end

  describe "creates access_context for task activities" do
    setup ctx do
      group = group_fixture(ctx.author)

      project = project_fixture(%{company_id: ctx.company.id, group_id: group.id, creator_id: ctx.author.id})
      project = Repo.preload(project, :access_context)

      milestone = milestone_fixture(ctx.author, %{project_id: project.id})
      task = task_fixture(%{ space_id: group.id, creator_id: ctx.author.id, milestone_id: milestone.id})

      Map.merge(ctx, %{project: project, task: task})
    end

    test "task_adding action", ctx do
      attrs = %{
        action: "task_adding",
        author_id: ctx.author.id,
        content: %{
          company_id: ctx.company.id,
          task_id: ctx.task.id,
          milestone_id: "",
          name: "",
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end
  end

  #
  # Steps
  #

  def create_activities(attrs) do
    Enum.map(1..3, fn _ ->
      activity_fixture(attrs)
    end)
  end

  def assert_no_context(activities) do
    Enum.each(activities, fn activity ->
      assert activity.context_id == nil
    end)
    activities
  end

  def assign_activity_context(activities) do
    Change013CreateActivitiesAccessContext.run()

    Enum.map(activities, fn activity ->
      Repo.reload(activity)
    end)
  end

  def assert_context_assigned(activities, context_id) do
    Enum.each(activities, fn activity ->
      assert activity.context_id == context_id
    end)
  end
end
