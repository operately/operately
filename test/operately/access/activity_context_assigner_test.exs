defmodule Operately.AccessActivityContextAssignerTest do
  use Operately.DataCase

  import Ecto.Query

  import Operately.UpdatesFixtures, only: [update_fixture: 1]
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures
  import Operately.GoalsFixtures
  import Operately.CommentsFixtures
  import Operately.ActivitiesFixtures

  alias Operately.Activities

  setup do
    company = company_fixture()
    author = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(author)
    goal = goal_fixture(author, %{space_id: group.id, targets: []})
    project = project_fixture(%{company_id: company.id, group_id: group.id, creator_id: author.id})

    {
      :ok,
      company: Repo.preload(company, :access_context),
      author: author,
      group: Repo.preload(group, :access_context),
      goal: Repo.preload(goal, :access_context),
      project: Repo.preload(project, :access_context),
      update: update_fixture(%{author_id: author.id, updatable_id: Ecto.UUID.generate(), updatable_type: :goal}),
      comment: comment_fixture(author, %{entity_id: project.id, entity_type: :project_check_in}),
      check_in: check_in_fixture(%{author_id: author.id, project_id: project.id}),
    }
  end

  describe "assigns access_context to company activities" do
    test "company_member_removed action", ctx do
      attrs = %{
        action: "company_member_removed",
        author_id: ctx.author.id,
        content: %{ company_id: ctx.company.id, name: "-", email: "-", title: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.company.access_context.id)
    end

    test "password_first_time_changed action", ctx do
      attrs = %{
        action: "password_first_time_changed",
        author_id: ctx.author.id,
        content: %{ company_id: ctx.company.id, invitatition_id: "-", admin_name: "-", admin_email: "-", member_name: "-", member_email: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.company.access_context.id)
    end

    test "company_invitation_token_created action", ctx do
      attrs = %{
        action: "company_invitation_token_created",
        author_id: ctx.author.id,
        content: %{ company_id: ctx.company.id, invitation_id: "-", name: "-", email: "-", title: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.company.access_context.id)
    end

    test "company_member_added action", ctx do
      attrs = %{
        action: "company_member_added",
        author_id: ctx.author.id,
        content: %{ company_id: ctx.company.id, invitatition_id: "-", name: "-", email: "-", title: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.company.access_context.id)
    end
  end

  describe "assigns access_context to space activities" do
    test "space_joining action", ctx do
      attrs = %{
        action: "space_joining",
        author_id: ctx.author.id,
        content: %{ space_id: ctx.group.id, company_id: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "goal_archived action", ctx do
      attrs = %{
        action: "goal_archived",
        author_id: ctx.author.id,
        content: %{ space_id: ctx.group.id, company_id: "-", goal_id: ctx.goal.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "discussion_posting action", ctx do
      attrs = %{
        action: "discussion_posting",
        author_id: ctx.author.id,
        content: %{ space_id: ctx.group.id, company_id: "-", title: "-", discussion_id: ctx.update.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "discussion_editing action", ctx do
      attrs = %{
        action: "discussion_editing",
        author_id: ctx.author.id,
        content: %{ space_id: ctx.group.id, company_id: "-", discussion_id: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "discussion_comment_submitted action", ctx do
      attrs = %{
        action: "discussion_comment_submitted",
        author_id: ctx.author.id,
        content: %{ space_id: ctx.group.id, company_id: "-", discussion_id: ctx.update.id, comment_id: ctx.comment.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "task_assignee_assignment action", ctx do
      attrs = %{
        action: "task_assignee_assignment",
        author_id: ctx.author.id,
        content: %{ space_id: ctx.group.id, company_id: "-", task_id: "-", person_id: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "task_description_change action", ctx do
      attrs = %{
        action: "task_description_change",
        author_id: ctx.author.id,
        content: %{ space_id: ctx.group.id, company_id: "-", task_id: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "task_name_editing action", ctx do
      attrs = %{
        action: "task_name_editing",
        author_id: ctx.author.id,
        content: %{ space_id: ctx.group.id, company_id: "-", task_id: "-", old_name: "-", new_name: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "task_priority_change action", ctx do
      attrs = %{
        action: "task_priority_change",
        author_id: ctx.author.id,
        content: %{ space_id: ctx.group.id, company_id: "-", task_id: "-", old_priority: "-", new_priority: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "task_reopening action", ctx do
      attrs = %{
        action: "task_reopening",
        author_id: ctx.author.id,
        content: %{ space_id: ctx.group.id, company_id: "-", task_id: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "task_size_change action", ctx do
      attrs = %{
        action: "task_size_change",
        author_id: ctx.author.id,
        content: %{ space_id: ctx.group.id, company_id: "-", task_id: "-", old_size: "-", new_size: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "group_edited action", ctx do
      attrs = %{
        action: "group_edited",
        author_id: ctx.author.id,
        content: %{ group_id: ctx.group.id, company_id: "-", old_name: "-", old_mission: "-", new_name: "-", new_mission: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.group.access_context.id)
    end

    test "goal_reparent action", ctx do
      attrs = %{
        action: "goal_reparent",
        author_id: ctx.author.id,
        content: %{ new_parent_goal_id: ctx.group.id, company_id: "-", old_parent_goal_id: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.group.access_context.id)
    end
  end

  describe "assigns access_context to goal activities" do
    test "goal_check_in action", ctx do
      attrs = %{
        action: "goal_check_in",
        author_id: ctx.author.id,
        content: %{ goal_id: ctx.goal.id, company_id: ctx.company.id, update_id: ctx.update.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_check_in_acknowledgement action", ctx do
      attrs = %{
        action: "goal_check_in_acknowledgement",
        author_id: ctx.author.id,
        content: %{ goal_id: ctx.goal.id, company_id: ctx.company.id, update_id: ctx.update.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_check_in_commented action", ctx do
      attrs = %{
        action: "goal_check_in_commented",
        author_id: ctx.author.id,
        content: %{ goal_id: ctx.goal.id, company_id: ctx.company.id, goal_check_in_id: ctx.check_in.id, comment_id: ctx.comment.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_check_in_edit action", ctx do
      attrs = %{
        action: "goal_check_in_edit",
        author_id: ctx.author.id,
        content: %{ goal_id: ctx.goal.id, company_id: ctx.company.id, check_in_id: ctx.check_in.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_closing action", ctx do
      attrs = %{
        action: "goal_closing",
        author_id: ctx.author.id,
        content: %{ goal_id: ctx.goal.id, company_id: ctx.comment.id, space_id: ctx.group.id, success: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_created action", ctx do
      attrs = %{
        action: "goal_created",
        author_id: ctx.author.id,
        content: %{
          goal_id: ctx.goal.id, company_id: ctx.company.id, space_id: ctx.group.id, creator_id: ctx.author.id, champion_id: ctx.author.id, reviewer_id: ctx.author.id, goal_name: "-",
          new_timeframe: %{ type: "days", start_date: Date.utc_today(), end_date: Date.add(Date.utc_today(), 2) },
        }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_discussion_creation action", ctx do
      Operately.Operations.GoalDiscussionCreation.run(
        ctx.author,
        ctx.goal.id,
        "some title",
        "{}"
      )
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_discussion_editing action", ctx do
      attrs = %{
        action: "goal_discussion_editing",
        author_id: ctx.author.id,
        content: %{ goal_id: ctx.goal.id, company_id: ctx.company.id, space_id: ctx.group.id, activity_id: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_editing action", ctx do
      attrs = %{
        action: "goal_editing",
        author_id: ctx.author.id,
        content: %{ goal_id: ctx.goal.id, company_id: ctx.company.id, old_name: "-", new_name: "-", old_champion_id: ctx.author.id, new_champion_id: ctx.author.id, old_reviewer_id: ctx.author.id, new_reviewer_id: ctx.author.id, }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "goal_reopening action", ctx do
      {:ok, goal} = Operately.Operations.GoalReopening.run(
        ctx.author,
        ctx.goal.id,
        "{}"
      )

      activity = from(a in Activities.Activity,
        where: a.content["goal_id"] == ^goal.id and a.action == "goal_reopening"
      )
      |> Operately.Repo.one()

      assert activity.context_id == ctx.goal.access_context.id
    end

    # test "goal_timeframe_editing action", ctx do
    #   attrs = %{
    #     action: "goal_timeframe_editing",
    #     author_id: ctx.author.id,
    #     content: %{
    #       goal_id: ctx.goal.id, company_id: ctx.company.id, space_id: ctx.group.id,
    #       old_timeframe: %{ type: "days", start_date: Date.utc_today(), end_date: Date.add(Date.utc_today(), 2) },
    #       new_timeframe: %{ type: "days", start_date: Date.utc_today(), end_date: Date.add(Date.utc_today(), 2) },
    #     }
    #   }

    #   create_activity(attrs)
    #   |> assert_context_assigned(ctx.goal.access_context.id)
    # end
  end

  describe "assigns access_context to project activities" do
    test "project_created action", ctx do
      attrs = %{
        action: "project_created",
        author_id: ctx.author.id,
        content: %{ project_id: ctx.project.id, company_id: ctx.company.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    # test "project_archived action", ctx do
    #   attrs = %{
    #     action: "project_archived",
    #     author_id: ctx.author.id,
    #     content: %{ project_id: ctx.project.id, company_id: ctx.company.id }
    #   }

    #   create_activity(attrs)
    #   |> assert_context_assigned(ctx.project.access_context.id)
    # end

    test "project_check_in_acknowledged action", ctx do
      attrs = %{
        action: "project_check_in_acknowledged",
        author_id: ctx.author.id,
        content: %{ project_id: ctx.project.id, company_id: ctx.company.id, check_in_id: ctx.check_in.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_check_in_commented action", ctx do
      attrs = %{
        action: "project_check_in_commented",
        author_id: ctx.author.id,
        content: %{ project_id: ctx.project.id, company_id: ctx.company.id, check_in_id: ctx.check_in.id, comment_id: ctx.comment.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_check_in_edit action", ctx do
      attrs = %{
        action: "project_check_in_edit",
        author_id: ctx.author.id,
        content: %{ project_id: ctx.project.id, company_id: ctx.company.id, check_in_id: ctx.check_in.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_check_in_submitted action", ctx do
      attrs = %{
        action: "project_check_in_submitted",
        author_id: ctx.author.id,
        content: %{ project_id: ctx.project.id, company_id: ctx.company.id, check_in_id: ctx.check_in.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    # test "project_closed action", ctx do
    #   attrs = %{
    #     action: "project_closed",
    #     author_id: ctx.author.id,
    #     content: %{ project_id: ctx.project.id, company_id: ctx.company.id }
    #   }

    #   create_activity(attrs)
    #   |> assert_context_assigned(ctx.project.access_context.id)
    # end

    # test "project_contributor_addition action", ctx do
    #   attrs = %{
    #     action: "project_contributor_addition",
    #     author_id: ctx.author.id,
    #     content: %{ project_id: ctx.project.id, company_id: ctx.company.id, person_id: ctx.author.id, contributor_id: ctx.author.id, responsibility: "-", role: "-" }
    #   }

    #   create_activity(attrs)
    #   |> assert_context_assigned(ctx.project.access_context.id)
    # end

    # test "project_discussion_submitted action", ctx do
    #   attrs = %{
    #     action: "project_discussion_submitted",
    #     author_id: ctx.author.id,
    #     content: %{ project_id: ctx.project.id, company_id: ctx.company.id, discussion_id: ctx.update.id, title: "some title" }
    #   }

    #   create_activity(attrs)
    #   |> assert_context_assigned(ctx.project.access_context.id)
    # end

    # test "project_goal_connection action", ctx do
    #   attrs = %{
    #     action: "project_goal_connection",
    #     author_id: ctx.author.id,
    #     content: %{ project_id: ctx.project.id, company_id: ctx.company.id, goal_id: ctx.goal.id }
    #   }

    #   create_activity(attrs)
    #   |> assert_context_assigned(ctx.project.access_context.id)
    # end

    # test "project_goal_disconnection action", ctx do
    #   attrs = %{
    #     action: "project_goal_disconnection",
    #     author_id: ctx.author.id,
    #     content: %{ project_id: ctx.project.id, company_id: ctx.company.id, goal_id: ctx.goal.id }
    #   }

    #   create_activity(attrs)
    #   |> assert_context_assigned(ctx.project.access_context.id)
    # end

    test "project_milestone_commented action", ctx do
      attrs = %{
        action: "project_milestone_commented",
        author_id: ctx.author.id,
        content: %{ project_id: ctx.project.id, company_id: ctx.company.id, milestone_id: "-", comment_id: ctx.comment.id, comment_action: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    # test "project_moved action", ctx do
    #   attrs = %{
    #     action: "project_moved",
    #     author_id: ctx.author.id,
    #     content: %{ project_id: ctx.project.id, company_id: ctx.company.id, old_space_id: ctx.group.id, new_space_id: ctx.group.id }
    #   }

    #   create_activity(attrs)
    #   |> assert_context_assigned(ctx.project.access_context.id)
    # end

    test "project_pausing action", ctx do
      attrs = %{
        action: "project_pausing",
        author_id: ctx.author.id,
        content: %{ project_id: ctx.project.id, company_id: ctx.company.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_renamed action", ctx do
      attrs = %{
        action: "project_renamed",
        author_id: ctx.author.id,
        content: %{ project_id: ctx.project.id, company_id: ctx.company.id, old_name: "-", new_name: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "project_resuming action", ctx do
      attrs = %{
        action: "project_resuming",
        author_id: ctx.author.id,
        content: %{ project_id: ctx.project.id, company_id: ctx.company.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    # test "project_timeline_edited action", ctx do
    #   attrs = %{
    #     action: "project_timeline_edited",
    #     author_id: ctx.author.id,
    #     content: %{ project_id: ctx.project.id, company_id: ctx.company.id, old_start_date: DateTime.utc_now(), new_start_date: DateTime.utc_now(), old_end_date: DateTime.utc_now(), new_end_date: DateTime.utc_now() }
    #   }

    #   create_activity(attrs)
    #   |> assert_context_assigned(ctx.project.access_context.id)
    # end
  end

  describe "assigns access_context to task activities" do
    setup ctx do
      milestone = milestone_fixture(ctx.author, %{project_id: ctx.project.id})
      task = task_fixture(%{ space_id: ctx.group.id, creator_id: ctx.author.id, milestone_id: milestone.id})

      Map.merge(ctx, %{milestone: milestone, task: task})
    end

    test "task_adding action", ctx do
      attrs = %{
        action: "task_adding",
        author_id: ctx.author.id,
        content: %{ task_id: ctx.task.id, company_id: ctx.company.id, milestone_id: ctx.milestone.id, name: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "task_closing action", ctx do
      attrs = %{
        action: "task_closing",
        author_id: ctx.author.id,
        content: %{ task_id: ctx.task.id, company_id: ctx.company.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "task_status_change action", ctx do
      attrs = %{
        action: "task_status_change",
        author_id: ctx.author.id,
        content: %{ task_id: ctx.task.id, company_id: ctx.company.id, old_status: "-", new_status: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "task_update action", ctx do
      attrs = %{
        action: "task_update",
        author_id: ctx.author.id,
        content: %{ task_id: ctx.task.id, company_id: ctx.company.id, old_name: "-", new_name: "-" }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.project.access_context.id)
    end
  end

  describe "assigns access_context to comment_added activity" do
    setup ctx do
      attrs = %{
        action: "project_created",
        author_id: ctx.author.id,
        content: %{
          project_id: ctx.project.id,
        },
        context_id: ctx.project.access_context.id,
      }

      parent_activity = activity_fixture(attrs)
      thread = comment_thread_fixture(%{parent_id: parent_activity.id})

      Map.merge(ctx, %{thread: thread, parent_activity: parent_activity})
    end

    test "entity_type is :project_check_in", ctx do
      comment = comment_fixture(ctx.author, %{entity_id: ctx.project.id, entity_type: :project_check_in})

      attrs = %{
        action: "comment_added",
        author_id: ctx.author.id,
        content: %{ comment_id: comment.id, company_id: ctx.company.id, project_id: ctx.project.id, space_id: ctx.group.id, goal_id: ctx.goal.id, comment_thread_id: ctx.thread.id, activity_id: ctx.parent_activity.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.project.access_context.id)
    end

    test "entity_type is :update", ctx do
      comment = comment_fixture(ctx.author, %{entity_id: ctx.goal.id, entity_type: :update})

      attrs = %{
        action: "comment_added",
        author_id: ctx.author.id,
        content: %{ comment_id: comment.id, company_id: ctx.company.id, project_id: ctx.project.id, space_id: ctx.group.id, goal_id: ctx.goal.id, comment_thread_id: ctx.thread.id, activity_id: ctx.parent_activity.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.goal.access_context.id)
    end

    test "entity_type is :comment_thread", ctx do
      comment = comment_fixture(ctx.author, %{entity_id: ctx.thread.id, entity_type: :comment_thread})

      attrs = %{
        action: "comment_added",
        author_id: ctx.author.id,
        content: %{ comment_id: comment.id, company_id: ctx.company.id, project_id: ctx.project.id, space_id: ctx.group.id, goal_id: ctx.goal.id, comment_thread_id: ctx.thread.id, activity_id: ctx.parent_activity.id }
      }

      create_activity(attrs)
      |> assert_context_assigned(ctx.project.access_context.id)
    end
  end

  #
  # Steps
  #

  def create_activity(attrs) do
    action = String.to_atom(attrs.action)

    Ecto.Multi.new()
    |> Activities.insert_sync(attrs.author_id, action, fn _ -> attrs.content end)
    |> Operately.Repo.transaction()
    |> Repo.extract_result(:updated_activity)
  end

  def assert_context_assigned(result, context_id) do
    {:ok, activity} = result

    assert activity.context_id == context_id
  end
end
