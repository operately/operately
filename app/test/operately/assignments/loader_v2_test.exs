defmodule Operately.Assignments.LoaderV2Test do
  use Operately.DataCase

  alias Operately.Assignments.LoaderV2
  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.ContextualDates.ContextualDate

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:champion, :space)
    |> Factory.add_space_member(:reviewer, :space)
  end

  describe "project check-ins" do
    test "when the next check-in date is in the past or today, returns as assignment", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)

      ctx = set_next_check_in_date(ctx, :project, days_ago(3))
      assignments = LoaderV2.load(ctx.champion, ctx.company)

      assert length(assignments) == 1
      assignment = hd(assignments)

      assert assignment.resource_id == Paths.project_id(ctx.project)
      assert assignment.type == :check_in
      assert assignment.role == :owner

      ctx = set_next_check_in_date(ctx, :project, today())
      assignments = LoaderV2.load(ctx.champion, ctx.company)

      assert length(assignments) == 1
      assignment = hd(assignments)

      assert assignment.resource_id == Paths.project_id(ctx.project)
      assert assignment.type == :check_in
      assert assignment.role == :owner
    end

    test "when the next check-in date is in the future, does not return as assignment", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)

      set_next_check_in_date(ctx, :project, days_from_now(3))

      assignments = LoaderV2.load(ctx.champion, ctx.company)
      assert assignments == []
    end

    test "when the project is closed or paused, does not return as assignment", ctx do
      ctx =
        ctx
        |> Factory.add_project(:closed_project, :space, champion: :champion, reviewer: :reviewer)
        |> Factory.add_project(:paused_project, :space, champion: :champion, reviewer: :reviewer)
        |> set_next_check_in_date(:closed_project, days_ago(3))
        |> set_next_check_in_date(:paused_project, days_ago(3))

      assignments = LoaderV2.load(ctx.champion, ctx.company)
      assert length(assignments) == 2

      ctx
      |> Factory.close_project(:closed_project)
      |> Factory.pause_project(:paused_project)

      assignments = LoaderV2.load(ctx.champion, ctx.company)
      assert assignments == []
    end

    test "when the project has not started yet, does not return as assignment", ctx do
      future_start_date = days_from_now(7)

      ctx =
        Factory.add_project(ctx, :future_project, :space,
          champion: :champion,
          reviewer: :reviewer,
          timeframe: %{
            contextual_start_date: ContextualDate.create_day_date(future_start_date),
            contextual_end_date: ContextualDate.create_day_date(days_from_now(30))
          }
        )

      ctx = set_next_check_in_date(ctx, :future_project, days_ago(3))

      assignments = LoaderV2.load(ctx.champion, ctx.company)
      assert assignments == []
    end

    test "when the project started today, returns as assignment", ctx do
      ctx =
        Factory.add_project(ctx, :today_project, :space,
          champion: :champion,
          reviewer: :reviewer,
          timeframe: %{
            contextual_start_date: ContextualDate.create_day_date(today()),
            contextual_end_date: ContextualDate.create_day_date(days_from_now(30))
          }
        )

      ctx = set_next_check_in_date(ctx, :today_project, days_ago(3))

      assignments = LoaderV2.load(ctx.champion, ctx.company)
      assert length(assignments) == 1

      assignment = hd(assignments)
      assert assignment.resource_id == Paths.project_id(ctx.today_project)
    end
  end

  describe "project check-in acknowledgements" do
    test "when the check-in is not acknowledged, returns as assignment", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)
      ctx = Factory.add_project_check_in(ctx, :check_in, :project, :champion)

      assignments = LoaderV2.load(ctx.reviewer, ctx.company)

      assert length(assignments) == 1
      assignment = hd(assignments)

      assert assignment.resource_id == Paths.project_check_in_id(ctx.check_in)
      assert assignment.type == :check_in
      assert assignment.role == :reviewer
    end

    test "when the check-in is acknowledged, does not return as assignment", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)
      ctx = Factory.add_project_check_in(ctx, :check_in, :project, :champion)

      acknowledge_check_in(ctx, :check_in, :reviewer)

      assignments = LoaderV2.load(ctx.reviewer, ctx.company)
      assert assignments == []
    end

    test "when the reviewer checked-in, the champion gets an assignment", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)
      ctx = Factory.add_project_check_in(ctx, :check_in, :project, :reviewer)

      champion_assignments = LoaderV2.load(ctx.champion, ctx.company)
      assert length(champion_assignments) == 1

      assignment = hd(champion_assignments)
      assert assignment.resource_id == Paths.project_check_in_id(ctx.check_in)
      assert assignment.role == :reviewer

      reviewer_assignments = LoaderV2.load(ctx.reviewer, ctx.company)
      assert reviewer_assignments == []
    end

    test "when the check-in is not acknowledged, but the project is closed or paused, does not return as assignment",
         ctx do
      ctx =
        ctx
        |> Factory.add_project(:closed_project, :space, champion: :champion, reviewer: :reviewer)
        |> Factory.add_project(:paused_project, :space, champion: :champion, reviewer: :reviewer)
        |> Factory.add_project_check_in(:check_in1, :closed_project, :champion)
        |> Factory.add_project_check_in(:check_in2, :paused_project, :champion)

      assignments = LoaderV2.load(ctx.reviewer, ctx.company)
      assert length(assignments) == 2

      ctx
      |> Factory.close_project(:closed_project)
      |> Factory.pause_project(:paused_project)

      assignments = LoaderV2.load(ctx.reviewer, ctx.company)
      assert assignments == []
    end
  end

  describe "goal updates" do
    test "when there's an unacknowledged goal update, returns as assignment", ctx do
      ctx = Factory.add_goal(ctx, :goal, :space, champion: :champion, reviewer: :reviewer)
      ctx = Factory.add_goal_update(ctx, :update, :goal, :champion)

      assignments = LoaderV2.load(ctx.reviewer, ctx.company)

      assert length(assignments) == 1
      assignment = hd(assignments)

      assert assignment.resource_id == Paths.goal_update_id(ctx.update)
      assert assignment.type == :goal_update
      assert assignment.role == :reviewer
      assert assignment.author_id == Paths.person_id(ctx.champion)
    end

    test "when the goal update is acknowledged, does not return as assignment", ctx do
      ctx = Factory.add_goal(ctx, :goal, :space, champion: :champion, reviewer: :reviewer)
      ctx = Factory.add_goal_update(ctx, :update, :goal, :champion)

      acknowledge_goal_update(ctx, :update, :reviewer)

      assignments = LoaderV2.load(ctx.reviewer, ctx.company)
      assert assignments == []
    end

    test "when the reviewer creates a goal update, the champion gets an assignment", ctx do
      ctx = Factory.add_goal(ctx, :goal, :space, champion: :champion, reviewer: :reviewer)
      ctx = Factory.add_goal_update(ctx, :update, :goal, :reviewer)

      champion_assignments = LoaderV2.load(ctx.champion, ctx.company)
      assert length(champion_assignments) == 1

      assignment = hd(champion_assignments)
      assert assignment.resource_id == Paths.goal_update_id(ctx.update)
      assert assignment.role == :reviewer

      reviewer_assignments = LoaderV2.load(ctx.reviewer, ctx.company)
      assert reviewer_assignments == []
    end

    test "when there's an unacknowledged goal update, but the goal is closed, does not return as assignment", ctx do
      ctx = Factory.add_goal(ctx, :goal, :space, champion: :champion, reviewer: :reviewer)
      ctx = Factory.add_goal_update(ctx, :update, :goal, :champion)

      assignments = LoaderV2.load(ctx.reviewer, ctx.company)
      assert length(assignments) == 1

      Factory.close_goal(ctx, :goal)

      assignments = LoaderV2.load(ctx.reviewer, ctx.company)
      assert assignments == []
    end
  end

  describe "goal check-ins" do
    test "when the next goal update date is in the past or today, returns as assignment", ctx do
      ctx = Factory.add_goal(ctx, :goal, :space, champion: :champion, reviewer: :reviewer)

      ctx = set_next_goal_update_date(ctx, :goal, days_ago(3))
      assignments = LoaderV2.load(ctx.champion, ctx.company)

      assert length(assignments) == 1
      assignment = hd(assignments)
      assert assignment.resource_id == Paths.goal_id(ctx.goal)
      assert assignment.type == :goal_update
      assert assignment.role == :owner

      ctx = set_next_goal_update_date(ctx, :goal, today())
      assignments = LoaderV2.load(ctx.champion, ctx.company)

      assert length(assignments) == 1
      assignment = hd(assignments)
      assert assignment.resource_id == Paths.goal_id(ctx.goal)
      assert assignment.type == :goal_update
      assert assignment.role == :owner
    end

    test "when the next goal update date is in the future, does not return as assignment", ctx do
      ctx = Factory.add_goal(ctx, :goal, :space, champion: :champion, reviewer: :reviewer)

      set_next_goal_update_date(ctx, :goal, days_from_now(3))

      assignments = LoaderV2.load(ctx.champion, ctx.company)
      assert assignments == []
    end

    test "when the goal is closed, does not return as assignment", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:goal, :space, champion: :champion, reviewer: :reviewer)
        |> set_next_goal_update_date(:goal, days_ago(3))

      assignments = LoaderV2.load(ctx.champion, ctx.company)
      assert length(assignments) == 1

      Factory.close_goal(ctx, :goal)

      assignments = LoaderV2.load(ctx.champion, ctx.company)
      assert assignments == []
    end
  end

  describe "space tasks" do
    test "returns assignments for tasks owned by the person", ctx do
      pending = Enum.find(ctx.space.task_statuses, &(&1.color == :gray)) |> Map.from_struct()
      in_progress = Enum.find(ctx.space.task_statuses, &(&1.color == :blue)) |> Map.from_struct()

      ctx =
        ctx
        |> Factory.create_space_task(:task1, :space,
          name: "Task 1",
          task_status: pending,
          due_date: ContextualDate.create_day_date(today())
        )
        |> Factory.add_task_assignee(:assignee1, :task1, :champion)
        |> Factory.create_space_task(:task2, :space,
          name: "Task 2",
          task_status: in_progress,
          due_date: ContextualDate.create_day_date(days_ago(1))
        )
        |> Factory.add_task_assignee(:assignee2, :task2, :champion)
        |> Factory.create_space_task(:other_task, :space,
          name: "Other Task",
          task_status: pending,
          due_date: ContextualDate.create_day_date(days_ago(1))
        )

      ctx = Factory.add_space_member(ctx, :other_person, :space)
      ctx = Factory.add_task_assignee(ctx, :other_assignee, :other_task, :other_person)

      assignments = LoaderV2.load(ctx.champion, ctx.company)
      task_assignments = Enum.filter(assignments, &(&1.type == :project_task))

      assert length(task_assignments) == 2

      [t1, t2] = Enum.sort_by(task_assignments, & &1.name)

      assert t1.resource_id == Paths.task_id(ctx.task1)
      assert t1.name == "Task 1"
      assert t1.role == :owner
      assert t1.task_status == :pending
      assert t1.action_label == "Task 1"
      assert t1.origin.name == ctx.space.name

      assert t2.resource_id == Paths.task_id(ctx.task2)
      assert t2.task_status == :in_progress
      assert t2.origin.name == ctx.space.name
    end
  end

  describe "project tasks" do
    test "returns assignments for tasks owned by the person", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)

      pending = Enum.find(ctx.project.task_statuses, &(&1.color == :gray)) |> Map.from_struct()
      in_progress = Enum.find(ctx.project.task_statuses, &(&1.color == :blue)) |> Map.from_struct()

      ctx =
        ctx
        |> Factory.add_project_task(:task1, nil,
          project_id: ctx.project.id,
          name: "Task 1",
          task_status: pending,
          due_date: ContextualDate.create_day_date(today())
        )
        |> Factory.add_task_assignee(:assignee1, :task1, :champion)
        |> Factory.add_project_task(:task2, nil,
          project_id: ctx.project.id,
          name: "Task 2",
          task_status: in_progress,
          due_date: ContextualDate.create_day_date(days_ago(1))
        )
        |> Factory.add_task_assignee(:assignee2, :task2, :champion)
        |> Factory.add_project_task(:other_task, nil,
          project_id: ctx.project.id,
          name: "Other Task",
          task_status: pending,
          due_date: ContextualDate.create_day_date(days_ago(1))
        )

      ctx = Factory.add_space_member(ctx, :other_person, :space)
      ctx = Factory.add_task_assignee(ctx, :other_assignee, :other_task, :other_person)

      assignments = LoaderV2.load(ctx.champion, ctx.company)
      task_assignments = Enum.filter(assignments, &(&1.type == :project_task))

      assert length(task_assignments) == 2

      [t1, t2] = Enum.sort_by(task_assignments, & &1.name)

      assert t1.resource_id == Paths.task_id(ctx.task1)
      assert t1.name == "Task 1"
      assert t1.role == :owner
      assert t1.task_status == :pending
      assert t1.action_label == "Task 1"
      assert t1.origin.name == ctx.project.name

      assert t2.resource_id == Paths.task_id(ctx.task2)
      assert t2.task_status == :in_progress
      assert t2.origin.name == ctx.project.name
    end

    test "ignores tasks from deleted projects", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)
      pending = Enum.find(ctx.project.task_statuses, &(&1.color == :gray)) |> Map.from_struct()

      ctx =
        ctx
        |> Factory.add_project_task(:task, nil,
          project_id: ctx.project.id,
          task_status: pending,
          due_date: ContextualDate.create_day_date(days_ago(1))
        )
        |> Factory.add_task_assignee(:assignee, :task, :champion)

      Repo.soft_delete(ctx.project)

      assignments = LoaderV2.load(ctx.champion, ctx.company)
      refute Enum.any?(assignments, &(&1.type == :project_task))
    end

    test "ignores tasks from closed projects", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)
      pending = Enum.find(ctx.project.task_statuses, &(&1.color == :gray)) |> Map.from_struct()

      ctx =
        ctx
        |> Factory.add_project_task(:task, nil,
          project_id: ctx.project.id,
          task_status: pending,
          due_date: ContextualDate.create_day_date(days_ago(1))
        )
        |> Factory.add_task_assignee(:assignee, :task, :champion)

      ctx = Factory.close_project(ctx, :project)

      assignments = LoaderV2.load(ctx.champion, ctx.company)
      refute Enum.any?(assignments, &(&1.type == :project_task))
    end
  end

  describe "project milestones" do
    test "returns assignments for pending milestones owned by the champion", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)

      timeframe = %{
        contextual_start_date: ContextualDate.create_day_date(today()),
        contextual_end_date: ContextualDate.create_day_date(days_from_now(7))
      }

      ctx =
        ctx
        |> Factory.add_project_milestone(:milestone1, :project,
          title: "Milestone 1",
          timeframe: timeframe,
          status: :pending
        )
        |> Factory.add_project_milestone(:milestone2, :project,
          title: "Milestone 2",
          timeframe: timeframe,
          status: :pending
        )
        |> Factory.add_project_milestone(:completed_milestone, :project,
          title: "Done",
          status: :done
        )

      assignments = LoaderV2.load(ctx.champion, ctx.company)
      milestone_assignments = Enum.filter(assignments, &(&1.type == :milestone))

      assert length(milestone_assignments) == 2

      names = Enum.map(milestone_assignments, & &1.name)
      assert Enum.sort(names) == ["Milestone 1", "Milestone 2"]

      Enum.each(milestone_assignments, fn assignment ->
        assert assignment.role == :owner
        assert assignment.action_label == assignment.name
        assert assignment.origin.name == ctx.project.name
      end)
    end

    test "ignores milestones from deleted projects", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)

      ctx =
        ctx
        |> Factory.add_project_milestone(:milestone, :project, status: :pending)

      Repo.soft_delete(ctx.project)

      assignments = LoaderV2.load(ctx.champion, ctx.company)
      refute Enum.any?(assignments, &(&1.type == :milestone))
    end

    test "ignores milestones from closed projects", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)

      ctx =
        ctx
        |> Factory.add_project_milestone(:milestone, :project, status: :pending)

      ctx = Factory.close_project(ctx, :project)

      assignments = LoaderV2.load(ctx.champion, ctx.company)
      refute Enum.any?(assignments, &(&1.type == :milestone))
    end

    test "ignores milestones for non-champions", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)

      ctx = Factory.add_project_milestone(ctx, :milestone, :project, status: :pending)
      ctx = Factory.add_space_member(ctx, :other_person, :space)

      assignments = LoaderV2.load(ctx.other_person, ctx.company)
      refute Enum.any?(assignments, &(&1.type == :milestone))
    end
  end

  # Helper functions
  defp acknowledge_goal_update(ctx, update_key, person_key) do
    {:ok, update} =
      ctx[update_key]
      |> Operately.Goals.Update.changeset(%{
        acknowledged_by_id: ctx[person_key].id,
        acknowledged_at: NaiveDateTime.utc_now()
      })
      |> Repo.update()

    Map.put(ctx, update_key, update)
  end

  defp set_next_goal_update_date(ctx, key, date) do
    {:ok, goal} =
      Operately.Goals.Goal.changeset(ctx[key], %{
        next_update_scheduled_at: Operately.Time.as_datetime(date)
      })
      |> Repo.update()

    Map.put(ctx, key, goal)
  end

  defp set_next_check_in_date(ctx, key, date) do
    {:ok, project} =
      Operately.Projects.Project.changeset(ctx[key], %{
        next_check_in_scheduled_at: Operately.Time.as_datetime(date)
      })
      |> Repo.update()

    Map.put(ctx, key, project)
  end

  defp acknowledge_check_in(ctx, check_in_key, person_key) do
    {:ok, check_in} =
      ctx[check_in_key]
      |> Operately.Projects.CheckIn.changeset(%{
        acknowledged_by_id: ctx[person_key].id,
        acknowledged_at: NaiveDateTime.utc_now()
      })
      |> Repo.update()

    Map.put(ctx, check_in_key, check_in)
  end

  def days_ago(num), do: Date.utc_today() |> Date.add(-num)
  def days_from_now(num), do: Date.utc_today() |> Date.add(num)
  def today, do: Date.utc_today()
end
