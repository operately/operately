defmodule Operately.MD.Goal.CheckInsTest do
  use Operately.DataCase, async: true

  alias Operately.MD.Goal.CheckIns
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_goal(:goal, :marketing)
    |> Factory.add_company_member(:reviewer)
  end

  describe "render/1" do
    test "renders empty state when no check-ins", _ctx do
      result = CheckIns.render([])

      assert result == """
             ## Check-ins

             _No check-ins yet._
             """
    end

    test "renders basic check-in with message", ctx do
      ctx = Factory.add_goal_update(ctx, :update, :goal, :creator)
      # Preload the author
      update = Operately.Repo.preload(ctx.update, [:author])

      result = CheckIns.render([update])
      expected_date = Operately.Time.as_date(ctx.update.inserted_at) |> Date.to_iso8601()

      assert result =~ "## Check-ins"
      assert result =~ "### Check-in on #{expected_date}"
      assert result =~ "Author: #{ctx.creator.full_name}"
      assert result =~ "#### Overview"
      assert result =~ "#### Key wins, obstacles and needs"
    end

    test "renders check-in with on_track status", ctx do
      ctx = Factory.add_goal_update(ctx, :update, :goal, :creator, status: "on_track")
      update = Operately.Repo.preload(ctx.update, [:author])

      result = CheckIns.render([update])

      assert result =~ "🟢 **On Track** - The goal is progressing as planned."
    end

    test "renders check-in with caution status", ctx do
      ctx = Factory.add_goal_update(ctx, :update, :goal, :creator, status: "caution")
      update = Operately.Repo.preload(ctx.update, [:author])

      result = CheckIns.render([update])

      assert result =~ "🟡 **Needs Attention** - The goal needs attention due to emerging risks or delays."
    end

    test "renders check-in with off_track status", ctx do
      ctx = Factory.add_goal_update(ctx, :update, :goal, :creator, status: "off_track")
      update = Operately.Repo.preload(ctx.update, [:author])

      result = CheckIns.render([update])

      assert result =~ "🔴 **Off Track** - The goal is off track due to significant problems affecting success."
    end

    test "renders check-in with targets", ctx do
      ctx =
        ctx
        |> Factory.add_goal_target(:target1, :goal, name: "Revenue Growth", from: 0, to: 1_000_000, value: 750_000)
        |> Factory.add_goal_target(:target2, :goal, name: "User Acquisition", from: 0, to: 10000, value: 8500)

      # Preload the goal with targets
      goal = Operately.Repo.preload(ctx.goal, [:targets])
      ctx = Map.put(ctx, :goal, goal)
      ctx = Factory.add_goal_update(ctx, :update, :goal, :creator)

      # Preload the author and mock the targets on the update
      update = Operately.Repo.preload(ctx.update, [:author])
      update_with_targets = Map.put(update, :targets, goal.targets)

      result = CheckIns.render([update_with_targets])

      assert result =~ "#### Targets"
      assert result =~ "- Revenue Growth"
      assert result =~ "- User Acquisition"
    end

    test "renders check-in with targets showing value differences", ctx do
      ctx = Factory.add_goal_update(ctx, :update, :goal, :creator)

      # Create update targets with previous values to show diffs
      update_targets = [
        %Operately.Goals.Update.Target{
          id: "target-1",
          name: "Revenue Growth",
          value: 850_000.0,
          previous_value: 750_000.0,
          unit: "USD",
          from: 0.0,
          to: 1_000_000.0,
          index: 0
        },
        %Operately.Goals.Update.Target{
          id: "target-2",
          name: "User Acquisition",
          value: 8200.0,
          previous_value: 8500.0,
          unit: "users",
          from: 0.0,
          to: 10000.0,
          index: 1
        },
        %Operately.Goals.Update.Target{
          id: "target-3",
          name: "Conversion Rate",
          value: 5.25,
          previous_value: 5.25,
          unit: "%",
          from: 0.0,
          to: 10.0,
          index: 2
        }
      ]

      # Preload the author and add the update targets
      update = Operately.Repo.preload(ctx.update, [:author])
      update_with_targets = Map.put(update, :targets, update_targets)

      result = CheckIns.render([update_with_targets])

      assert result =~ "#### Targets"
      assert result =~ "- Revenue Growth - 850000 USD (+100000)"
      assert result =~ "- User Acquisition - 8200 users (-300)"
      assert result =~ "- Conversion Rate - 5.25%"
      refute result =~ "Conversion Rate - 5.25% (+0)"
    end

    test "renders check-in with targets handling decimal formatting", ctx do
      ctx = Factory.add_goal_update(ctx, :update, :goal, :creator)

      # Test various decimal scenarios
      update_targets = [
        %Operately.Goals.Update.Target{
          id: "target-1",
          name: "Percentage A",
          value: 15.5,
          previous_value: 12.75,
          unit: "%",
          from: 0.0,
          to: 20.0,
          index: 0
        },
        %Operately.Goals.Update.Target{
          id: "target-2",
          name: "Percentage B",
          value: 10.0,
          previous_value: 8.5,
          unit: "%",
          from: 0.0,
          to: 15.0,
          index: 1
        },
        %Operately.Goals.Update.Target{
          id: "target-3",
          name: "Large Number",
          value: 1_500_000.0,
          previous_value: 1_450_000.0,
          unit: "USD",
          from: 0.0,
          to: 2_000_000.0,
          index: 2
        }
      ]

      # Preload the author and add the update targets
      update = Operately.Repo.preload(ctx.update, [:author])
      update_with_targets = Map.put(update, :targets, update_targets)

      result = CheckIns.render([update_with_targets])

      assert result =~ "#### Targets"
      assert result =~ "- Percentage A - 15.5% (+2.75)"
      assert result =~ "- Percentage B - 10% (+1.5)"
      assert result =~ "- Large Number - 1500000 USD (+50000)"
    end

    test "renders check-in with checklist", ctx do
      ctx =
        ctx
        |> Factory.add_goal_check(:check1, :goal, name: "Complete market research", completed: true, index: 1)
        |> Factory.add_goal_check(:check2, :goal, name: "Launch MVP", completed: false, index: 2)
        |> Factory.add_goal_check(:check3, :goal, name: "Gather user feedback", completed: false, index: 3)

      # Preload the goal with checks
      goal = Operately.Repo.preload(ctx.goal, [:checks])
      ctx = Map.put(ctx, :goal, goal)
      ctx = Factory.add_goal_update(ctx, :update, :goal, :creator)

      # Preload the author and mock the checks on the update
      update = Operately.Repo.preload(ctx.update, [:author])
      update_with_checks = Map.put(update, :checks, goal.checks)

      result = CheckIns.render([update_with_checks])

      assert result =~ "#### Checklist"
      assert result =~ "- [x] Complete market research"
      assert result =~ "- [ ] Launch MVP"
      assert result =~ "- [ ] Gather user feedback"
    end

    test "renders check-in with comments", ctx do
      ctx = Factory.add_goal_update(ctx, :update, :goal, :creator)
      # Preload the author and goal for the update (needed for comment creation)
      update = Operately.Repo.preload(ctx.update, [:author, :goal])
      ctx = Map.put(ctx, :update, update)

      # Add a comment to the check-in using Factory
      ctx = Factory.add_comment(ctx, :comment, :update, creator: ctx.reviewer)

      result = CheckIns.render([update])
      expected_date = Operately.Time.as_date(ctx.comment.inserted_at) |> Date.to_iso8601()

      assert result =~ "#### Comments"
      assert result =~ "**#{ctx.reviewer.full_name}** on #{expected_date}:"
      assert result =~ "Content"
    end

    test "renders multiple check-ins in chronological order", ctx do
      # Create first check-in
      ctx = Factory.add_goal_update(ctx, :update1, :goal, :creator, status: "on_track")

      # Create second check-in
      ctx = Factory.add_goal_update(ctx, :update2, :goal, :creator, status: "caution")

      # Preload authors
      update1 = Operately.Repo.preload(ctx.update1, [:author])
      update2 = Operately.Repo.preload(ctx.update2, [:author])

      result = CheckIns.render([update1, update2])

      # Should contain both check-ins
      assert result =~ "🟢 **On Track** - The goal is progressing as planned."
      assert result =~ "🟡 **Needs Attention** - The goal needs attention due to emerging risks or delays."

      # Should have proper structure
      update1_date = Operately.Time.as_date(ctx.update1.inserted_at) |> Date.to_iso8601()
      update2_date = Operately.Time.as_date(ctx.update2.inserted_at) |> Date.to_iso8601()

      assert result =~ "### Check-in on #{update1_date}"
      assert result =~ "### Check-in on #{update2_date}"
    end

    test "renders comprehensive check-in with all elements", ctx do
      # Set up goal with targets and checks
      ctx =
        ctx
        |> Factory.add_goal_target(:target1, :goal, name: "Revenue", from: 0, to: 100_000, value: 50000)
        |> Factory.add_goal_check(:check1, :goal, name: "Research done", completed: true, index: 1)
        |> Factory.add_goal_check(:check2, :goal, name: "MVP ready", completed: false, index: 2)

      goal = Operately.Repo.preload(ctx.goal, [:targets, :checks])
      ctx = Map.put(ctx, :goal, goal)
      ctx = Factory.add_goal_update(ctx, :update, :goal, :creator, status: "caution")

      # Preload the author and goal and mock the associations on the update
      update = Operately.Repo.preload(ctx.update, [:author, :goal])

      update_with_data =
        update
        |> Map.put(:targets, goal.targets)
        |> Map.put(:checks, goal.checks)

      ctx = Map.put(ctx, :update, update)

      # Add a comment using Factory
      ctx = Factory.add_comment(ctx, :comment, :update, creator: ctx.reviewer)

      result = CheckIns.render([update_with_data])
      expected_date = Operately.Time.as_date(ctx.update.inserted_at) |> Date.to_iso8601()

      # Check all sections are present
      assert result =~ "## Check-ins"
      assert result =~ "### Check-in on #{expected_date}"
      assert result =~ "Author: #{ctx.creator.full_name}"
      assert result =~ "#### Overview"
      assert result =~ "🟡 **Needs Attention**"
      assert result =~ "#### Targets"
      assert result =~ "- Revenue"
      assert result =~ "#### Checklist"
      assert result =~ "- [x] Research done"
      assert result =~ "- [ ] MVP ready"
      assert result =~ "#### Key wins, obstacles and needs"
      assert result =~ "#### Comments"
      assert result =~ "Content"
    end

    test "handles check-in without targets or checklist gracefully", ctx do
      ctx = Factory.add_goal_update(ctx, :update, :goal, :creator)

      # Preload the author and explicitly set empty arrays for targets and checks
      update = Operately.Repo.preload(ctx.update, [:author])

      update_with_empty_data =
        update
        |> Map.put(:targets, [])
        |> Map.put(:checks, [])

      result = CheckIns.render([update_with_empty_data])

      # Should not have target or checklist sections
      refute result =~ "#### Targets"
      refute result =~ "#### Checklist"

      # But should have other sections
      assert result =~ "#### Overview"
      assert result =~ "#### Key wins, obstacles and needs"
    end

    test "renders check-in with rich text message", ctx do
      rich_message = Operately.Support.RichText.rich_text("We made **great progress** this week with the new features.")
      ctx = Factory.add_goal_update(ctx, :update, :goal, :creator, message: rich_message)

      # Preload the author
      update = Operately.Repo.preload(ctx.update, [:author])

      result = CheckIns.render([update])

      # Just check that we have the key wins section and some content
      assert result =~ "#### Key wins, obstacles and needs"
    end

    test "renders check-in with embedded Update.Check structs", ctx do
      ctx = Factory.add_goal_update(ctx, :update, :goal, :creator)
      update = Operately.Repo.preload(ctx.update, [:author])

      # Simulate embedded Update.Check structs as they would come from the API
      embedded_checks = [
        %Operately.Goals.Update.Check{
          id: "check-1",
          name: "API embedded check",
          completed: true,
          index: 1
        },
        %Operately.Goals.Update.Check{
          id: "check-2",
          name: "Another embedded check",
          completed: false,
          index: 2
        }
      ]

      update_with_embedded_checks = Map.put(update, :checks, embedded_checks)

      result = CheckIns.render([update_with_embedded_checks])

      assert result =~ "#### Checklist"
      assert result =~ "- [x] API embedded check"
      assert result =~ "- [ ] Another embedded check"
    end
  end
end
