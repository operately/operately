defmodule Operately.Assignments.CategorizerTest do
  use ExUnit.Case, async: true

  alias Operately.Assignments.Categorizer
  alias Operately.Assignments.Assignment

  describe "categorize/1" do
    test "categorizes assignments into due_soon, needs_review, and upcoming" do
      assignments = [
        build_assignment(:owner, :overdue, ~D[2024-01-01], origin_id: "project-1"),
        build_assignment(:reviewer, :overdue, ~D[2024-01-02], origin_id: "project-2"),
        build_assignment(:owner, :upcoming, ~D[2024-12-01], origin_id: "project-3")
      ]

      result = Categorizer.categorize(assignments)

      assert %Categorizer.AssignmentCategory{} = result
      assert length(result.due_soon) == 1
      assert length(result.needs_review) == 1
      assert length(result.upcoming) == 1
    end

    test "filters owner assignments into due_soon when overdue" do
      assignments = [
        build_assignment(:owner, :overdue, ~D[2024-01-01], origin_id: "project-1"),
        build_assignment(:owner, :upcoming, ~D[2024-12-01], origin_id: "project-2")
      ]

      result = Categorizer.categorize(assignments)

      assert length(result.due_soon) == 1
      assert length(result.upcoming) == 1
    end

    test "filters owner assignments into due_soon when due_today" do
      assignments = [
        build_assignment(:owner, :due_today, Date.utc_today(), origin_id: "project-1")
      ]

      result = Categorizer.categorize(assignments)

      assert length(result.due_soon) == 1
      assert length(result.upcoming) == 0
    end

    test "filters owner assignments into due_soon when due_soon" do
      tomorrow = Date.add(Date.utc_today(), 1)
      assignments = [
        build_assignment(:owner, :due_soon, tomorrow, origin_id: "project-1")
      ]

      result = Categorizer.categorize(assignments)

      assert length(result.due_soon) == 1
      assert length(result.upcoming) == 0
    end

    test "filters reviewer assignments into needs_review" do
      assignments = [
        build_assignment(:reviewer, :overdue, ~D[2024-01-01], origin_id: "project-1"),
        build_assignment(:reviewer, :due_today, Date.utc_today(), origin_id: "project-2")
      ]

      result = Categorizer.categorize(assignments)

      assert length(result.needs_review) == 2
      assert length(result.due_soon) == 0
    end

    test "groups assignments by origin" do
      assignments = [
        build_assignment(:owner, :overdue, ~D[2024-01-01], origin_id: "project-1", origin_name: "Project A"),
        build_assignment(:owner, :overdue, ~D[2024-01-02], origin_id: "project-1", origin_name: "Project A"),
        build_assignment(:owner, :overdue, ~D[2024-01-03], origin_id: "project-2", origin_name: "Project B")
      ]

      result = Categorizer.categorize(assignments)

      assert length(result.due_soon) == 2

      [group1, group2] = result.due_soon
      assert length(group1.assignments) == 2
      assert length(group2.assignments) == 1
    end
  end

  describe "sorting within groups" do
    test "sorts assignments by urgency: overdue before due_today before due_soon" do
      assignments = [
        build_assignment(:owner, :due_soon, ~D[2024-03-01], origin_id: "project-1", name: "Due Soon"),
        build_assignment(:owner, :due_today, Date.utc_today(), origin_id: "project-1", name: "Due Today"),
        build_assignment(:owner, :overdue, ~D[2024-01-01], origin_id: "project-1", name: "Overdue")
      ]

      result = Categorizer.categorize(assignments)

      [group] = result.due_soon
      [first, second, third] = group.assignments

      assert first.name == "Overdue"
      assert second.name == "Due Today"
      assert third.name == "Due Soon"
    end

    test "sorts overdue assignments by date: most overdue first" do
      assignments = [
        build_assignment(:owner, :overdue, ~D[2024-02-15], origin_id: "project-1", name: "15 days overdue"),
        build_assignment(:owner, :overdue, ~D[2024-01-01], origin_id: "project-1", name: "58 days overdue"),
        build_assignment(:owner, :overdue, ~D[2024-02-01], origin_id: "project-1", name: "29 days overdue")
      ]

      result = Categorizer.categorize(assignments)

      [group] = result.due_soon
      [first, second, third] = group.assignments

      assert first.name == "58 days overdue"
      assert second.name == "29 days overdue"
      assert third.name == "15 days overdue"
    end

    test "sorts upcoming assignments by date: soonest first" do
      assignments = [
        build_assignment(:owner, :upcoming, ~D[2024-12-31], origin_id: "project-1", name: "Far future"),
        build_assignment(:owner, :upcoming, ~D[2024-06-01], origin_id: "project-1", name: "Mid year"),
        build_assignment(:owner, :upcoming, ~D[2024-04-01], origin_id: "project-1", name: "Next month")
      ]

      result = Categorizer.categorize(assignments)

      [group] = result.upcoming
      [first, second, third] = group.assignments

      assert first.name == "Next month"
      assert second.name == "Mid year"
      assert third.name == "Far future"
    end

    test "places assignments with dates before assignments without dates" do
      assignments = [
        build_assignment(:owner, :none, nil, origin_id: "project-1", name: "No date"),
        build_assignment(:owner, :upcoming, ~D[2024-12-01], origin_id: "project-1", name: "Has date")
      ]

      result = Categorizer.categorize(assignments)

      [group] = result.upcoming
      [first, second] = group.assignments

      assert first.name == "Has date"
      assert second.name == "No date"
    end
  end

  describe "sorting groups" do
    test "sorts groups by most urgent assignment: most overdue group first" do
      assignments = [
        # Project A: most overdue is 30 days
        build_assignment(:owner, :overdue, ~D[2024-02-01], origin_id: "project-a", origin_name: "Project A", name: "A1"),
        build_assignment(:owner, :overdue, ~D[2024-02-15], origin_id: "project-a", origin_name: "Project A", name: "A2"),

        # Project B: most overdue is 58 days
        build_assignment(:owner, :overdue, ~D[2024-01-01], origin_id: "project-b", origin_name: "Project B", name: "B1"),
        build_assignment(:owner, :overdue, ~D[2024-02-10], origin_id: "project-b", origin_name: "Project B", name: "B2"),

        # Project C: most overdue is 45 days
        build_assignment(:owner, :overdue, ~D[2024-01-15], origin_id: "project-c", origin_name: "Project C", name: "C1")
      ]

      result = Categorizer.categorize(assignments)

      [group1, group2, group3] = result.due_soon

      assert group1.origin.name == "Project B"  # 58 days overdue
      assert group2.origin.name == "Project C"  # 45 days overdue
      assert group3.origin.name == "Project A"  # 30 days overdue
    end

    test "sorts groups by urgency status when dates are equal" do
      today = Date.utc_today()

      assignments = [
        build_assignment(:owner, :due_soon, Date.add(today, 1), origin_id: "project-a", origin_name: "Project A"),
        build_assignment(:owner, :overdue, Date.add(today, -1), origin_id: "project-b", origin_name: "Project B"),
        build_assignment(:owner, :due_today, today, origin_id: "project-c", origin_name: "Project C")
      ]

      result = Categorizer.categorize(assignments)

      [group1, group2, group3] = result.due_soon

      assert group1.origin.name == "Project B"  # overdue
      assert group2.origin.name == "Project C"  # due_today
      assert group3.origin.name == "Project A"  # due_soon
    end

    test "sorts groups with mixed urgency levels correctly" do
      assignments = [
        # Group A: has due_soon (least urgent in due_soon category)
        build_assignment(:owner, :due_soon, ~D[2024-03-05], origin_id: "project-a", origin_name: "Project A"),

        # Group B: has overdue (most urgent)
        build_assignment(:owner, :overdue, ~D[2024-02-01], origin_id: "project-b", origin_name: "Project B"),

        # Group C: has due_today (middle urgency)
        build_assignment(:owner, :due_today, Date.utc_today(), origin_id: "project-c", origin_name: "Project C")
      ]

      result = Categorizer.categorize(assignments)

      [group1, group2, group3] = result.due_soon

      assert group1.origin.name == "Project B"  # overdue
      assert group2.origin.name == "Project C"  # due_today
      assert group3.origin.name == "Project A"  # due_soon
    end
  end

  describe "reviewer assignment sorting" do
    test "sorts reviewer assignments by submission date: oldest first (waiting longest)" do
      # Simulate check-ins submitted on different dates
      # Older submissions should appear first (they've been waiting longer for review)
      assignments = [
        build_assignment(:reviewer, :overdue, ~D[2024-02-20], origin_id: "project-1", name: "Submitted Feb 20"),
        build_assignment(:reviewer, :overdue, ~D[2024-02-01], origin_id: "project-1", name: "Submitted Feb 1"),
        build_assignment(:reviewer, :overdue, ~D[2024-02-15], origin_id: "project-1", name: "Submitted Feb 15")
      ]

      result = Categorizer.categorize(assignments)

      [group] = result.needs_review
      [first, second, third] = group.assignments

      # Oldest submission (Feb 1) should be first - it's been waiting longest
      assert first.name == "Submitted Feb 1"
      assert second.name == "Submitted Feb 15"
      assert third.name == "Submitted Feb 20"
    end

    test "sorts mixed reviewer assignments by urgency then submission date" do
      today = Date.utc_today()
      yesterday = Date.add(today, -1)
      two_days_ago = Date.add(today, -2)

      assignments = [
        build_assignment(:reviewer, :due_today, today, origin_id: "project-1", name: "Submitted today"),
        build_assignment(:reviewer, :overdue, yesterday, origin_id: "project-1", name: "Submitted yesterday"),
        build_assignment(:reviewer, :overdue, two_days_ago, origin_id: "project-1", name: "Submitted 2 days ago")
      ]

      result = Categorizer.categorize(assignments)

      [group] = result.needs_review
      [first, second, third] = group.assignments

      # Overdue items first, then by submission date (oldest first)
      assert first.name == "Submitted 2 days ago"
      assert second.name == "Submitted yesterday"
      assert third.name == "Submitted today"
    end
  end

  describe "edge cases" do
    test "handles empty assignment list" do
      result = Categorizer.categorize([])

      assert result.due_soon == []
      assert result.needs_review == []
      assert result.upcoming == []
    end

    test "handles assignments with nil due_date" do
      assignments = [
        build_assignment(:owner, :none, nil, origin_id: "project-1")
      ]

      result = Categorizer.categorize(assignments)

      assert length(result.upcoming) == 1
    end

    test "handles single assignment" do
      assignments = [
        build_assignment(:owner, :overdue, ~D[2024-01-01], origin_id: "project-1")
      ]

      result = Categorizer.categorize(assignments)

      assert length(result.due_soon) == 1
      [group] = result.due_soon
      assert length(group.assignments) == 1
    end
  end

  # Helper functions

  defp build_assignment(role, due_status, due_date, opts \\ []) do
    origin_id = Keyword.get(opts, :origin_id, "default-origin")
    origin_name = Keyword.get(opts, :origin_name, "Default Origin")
    name = Keyword.get(opts, :name, "Test Assignment")

    %Assignment{
      resource_id: "assignment-#{:rand.uniform(10000)}",
      name: name,
      due: due_date,
      type: :project_task,
      role: role,
      path: "/test/path",
      origin: %Assignment.Origin{
        id: origin_id,
        name: origin_name,
        type: :project,
        path: "/test/origin"
      },
      due_date: due_date,
      due_status: due_status,
      due_status_label: "Test label"
    }
  end
end
