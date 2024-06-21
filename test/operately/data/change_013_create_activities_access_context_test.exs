defmodule Operately.Data.Change013CreateActivitiesAccessContextTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.ActivitiesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures
  import Operately.GoalsFixtures
  import Operately.CommentsFixtures

  alias Operately.Data.Change013CreateActivitiesAccessContext

  setup do
    company = company_fixture()
    company = Repo.preload(company, :access_context)

    author = person_fixture_with_account(%{company_id: company.id})

    {:ok, company: company, author: author}
  end

  describe "assigns access_context to company activities" do
    test "company_member_removed action", ctx do
      attrs = %{
        action: "company_member_removed",
        author_id: ctx.author.id,
        content: %{
          company_id: ctx.company.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.company.access_context.id)
    end

    test "password_first_time_changed action", ctx do
      attrs = %{
        action: "password_first_time_changed",
        author_id: ctx.author.id,
        content: %{
          company_id: ctx.company.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.company.access_context.id)
    end

    test "company_invitation_token_created action", ctx do
      attrs = %{
        action: "company_invitation_token_created",
        author_id: ctx.author.id,
        content: %{
          company_id: ctx.company.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.company.access_context.id)
    end

    test "company_member_added action", ctx do
      attrs = %{
        action: "company_member_added",
        author_id: ctx.author.id,
        content: %{
          company_id: ctx.company.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.company.access_context.id)
    end
  end

  describe "assigns access_context to space activities" do
    setup ctx do
      group = group_fixture(ctx.author)
      group = Repo.preload(group, :access_context)

      Map.merge(ctx, %{group: group})
    end

    test "space_joining action", ctx do
      attrs = %{
        action: "space_joining",
        author_id: ctx.author.id,
        content: %{
          space_id: ctx.group.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "goal_archived action", ctx do
      attrs = %{
        action: "goal_archived",
        author_id: ctx.author.id,
        content: %{
          space_id: ctx.group.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "discussion_posting action", ctx do
      attrs = %{
        action: "discussion_posting",
        author_id: ctx.author.id,
        content: %{
          space_id: ctx.group.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "discussion_editing action", ctx do
      attrs = %{
        action: "discussion_editing",
        author_id: ctx.author.id,
        content: %{
          space_id: ctx.group.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "discussion_comment_submitted action", ctx do
      attrs = %{
        action: "discussion_comment_submitted",
        author_id: ctx.author.id,
        content: %{
          space_id: ctx.group.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "task_assignee_assignment action", ctx do
      attrs = %{
        action: "task_assignee_assignment",
        author_id: ctx.author.id,
        content: %{
          space_id: ctx.group.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "task_description_change action", ctx do
      attrs = %{
        action: "task_description_change",
        author_id: ctx.author.id,
        content: %{
          space_id: ctx.group.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "task_name_editing action", ctx do
      attrs = %{
        action: "task_name_editing",
        author_id: ctx.author.id,
        content: %{
          space_id: ctx.group.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "task_priority_change action", ctx do
      attrs = %{
        action: "task_priority_change",
        author_id: ctx.author.id,
        content: %{
          space_id: ctx.group.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "task_reopening action", ctx do
      attrs = %{
        action: "task_reopening",
        author_id: ctx.author.id,
        content: %{
          space_id: ctx.group.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "task_size_change action", ctx do
      attrs = %{
        action: "task_size_change",
        author_id: ctx.author.id,
        content: %{
          space_id: ctx.group.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "group_edited action", ctx do
      attrs = %{
        action: "group_edited",
        author_id: ctx.author.id,
        content: %{
          group_id: ctx.group.id,
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
          new_parent_goal_id: ctx.group.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.group.access_context.id)
    end
  end

  describe "assigns access_context to goal activities" do
    setup ctx do
      group = group_fixture(ctx.author)

      goal = goal_fixture(ctx.author, %{space_id: group.id, targets: []})
      goal = Repo.preload(goal, :access_context)

      Map.merge(ctx, %{goal: goal})
    end

    test "goal_check_in action", ctx do
      attrs = %{
        action: "goal_check_in",
        author_id: ctx.author.id,
        content: %{
          goal_id: ctx.goal.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_check_in_acknowledgement action", ctx do
      attrs = %{
        action: "goal_check_in_acknowledgement",
        author_id: ctx.author.id,
        content: %{
          goal_id: ctx.goal.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_check_in_commented action", ctx do
      attrs = %{
        action: "goal_check_in_commented",
        author_id: ctx.author.id,
        content: %{
          goal_id: ctx.goal.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_check_in_edit action", ctx do
      attrs = %{
        action: "goal_check_in_edit",
        author_id: ctx.author.id,
        content: %{
          goal_id: ctx.goal.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_closing action", ctx do
      attrs = %{
        action: "goal_closing",
        author_id: ctx.author.id,
        content: %{
          goal_id: ctx.goal.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_created action", ctx do
      attrs = %{
        action: "goal_created",
        author_id: ctx.author.id,
        content: %{
          goal_id: ctx.goal.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_discussion_creation action", ctx do
      attrs = %{
        action: "goal_discussion_creation",
        author_id: ctx.author.id,
        content: %{
          goal_id: ctx.goal.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_discussion_editing action", ctx do
      attrs = %{
        action: "goal_discussion_editing",
        author_id: ctx.author.id,
        content: %{
          goal_id: ctx.goal.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_editing action", ctx do
      attrs = %{
        action: "goal_editing",
        author_id: ctx.author.id,
        content: %{
          goal_id: ctx.goal.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_reopening action", ctx do
      attrs = %{
        action: "goal_reopening",
        author_id: ctx.author.id,
        content: %{
          goal_id: ctx.goal.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_timeframe_editing action", ctx do
      attrs = %{
        action: "goal_timeframe_editing",
        author_id: ctx.author.id,
        content: %{
          goal_id: ctx.goal.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.goal.access_context.id)
    end
  end

  describe "assigns access_context to project activities" do
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
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_check_in_acknowledged action", ctx do
      attrs = %{
        action: "project_check_in_acknowledged",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_check_in_commented action", ctx do
      attrs = %{
        action: "project_check_in_commented",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_check_in_edit action", ctx do
      attrs = %{
        action: "project_check_in_edit",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_check_in_submitted action", ctx do
      attrs = %{
        action: "project_check_in_submitted",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_closed action", ctx do
      attrs = %{
        action: "project_closed",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_contributor_addition action", ctx do
      attrs = %{
        action: "project_contributor_addition",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_discussion_submitted action", ctx do
      attrs = %{
        action: "project_discussion_submitted",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_goal_connection action", ctx do
      attrs = %{
        action: "project_goal_connection",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_goal_disconnection action", ctx do
      attrs = %{
        action: "project_goal_disconnection",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_milestone_commented action", ctx do
      attrs = %{
        action: "project_milestone_commented",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_moved action", ctx do
      attrs = %{
        action: "project_moved",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_pausing action", ctx do
      attrs = %{
        action: "project_pausing",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_renamed action", ctx do
      attrs = %{
        action: "project_renamed",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_resuming action", ctx do
      attrs = %{
        action: "project_resuming",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_timeline_edited action", ctx do
      attrs = %{
        action: "project_timeline_edited",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end
  end

  describe "assigns access_context to task activities" do
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
          task_id: ctx.task.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "task_closing action", ctx do
      attrs = %{
        action: "task_closing",
        author_id: ctx.author.id,
        content: %{
          task_id: ctx.task.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "task_status_change action", ctx do
      attrs = %{
        action: "task_status_change",
        author_id: ctx.author.id,
        content: %{
          task_id: ctx.task.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "task_update action", ctx do
      attrs = %{
        action: "task_update",
        author_id: ctx.author.id,
        content: %{
          task_id: ctx.task.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end
  end

  describe "assigns access_context to comment_added activity" do
    setup ctx do
      group = group_fixture(ctx.author)

      project = project_fixture(%{company_id: ctx.company.id, group_id: group.id, creator_id: ctx.author.id})
      project = Repo.preload(project, :access_context)

      Map.merge(ctx, %{group: group, project: project})
    end

    test "entity_type is :project_check_in", ctx do
      comment = comment_fixture(ctx.author, %{entity_id: ctx.project.id, entity_type: :project_check_in})

      attrs = %{
        action: "comment_added",
        author_id: ctx.author.id,
        content: %{
          comment_id: comment.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context
      |> assign_activity_context
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "entity_type is :update", ctx do
      goal = goal_fixture(ctx.author, %{space_id: ctx.group.id, targets: []})
      goal = Repo.preload(goal, :access_context)

      comment = comment_fixture(ctx.author, %{entity_id: goal.id, entity_type: :update})

      attrs = %{
        action: "comment_added",
        author_id: ctx.author.id,
        content: %{
          comment_id: comment.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context()
      |> assign_activity_context()
      |> assert_context_assigned(goal.access_context.id)
    end

    test "entity_type is :comment_thread", ctx do
      # First, create parent activity and comment thread
      attrs = %{
        action: "project_created",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        }
      }

      parent_activity = activity_fixture(attrs)
      thread = comment_thread_fixture(%{parent_id: parent_activity.id})

      # Then, create comment with thread as entity
      comment = comment_fixture(ctx.author, %{entity_id: thread.id, entity_type: :comment_thread})

      attrs = %{
        action: "comment_added",
        author_id: ctx.author.id,
        content: %{
          comment_id: comment.id,
        }
      }

      create_activities(attrs)
      |> assert_no_context()
      |> assign_activity_context()
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "entity_type is nil", ctx do
      comment = comment_fixture(ctx.author, %{})

      attrs = %{
        action: "comment_added",
        author_id: ctx.author.id,
        content: %{
          comment_id: comment.id,
        }
      }

      activity_fixture(attrs)

      assert_raise RuntimeError, "Activity not handled in the data migration comment_added", fn ->
        Change013CreateActivitiesAccessContext.run()
      end
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
