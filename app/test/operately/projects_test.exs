defmodule Operately.ProjectsTest do
  use Operately.DataCase

  alias Operately.Projects
  alias Operately.Access.Binding
  alias Operately.ContextualDates.ContextualDate

  import Operately.ProjectsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.CompaniesFixtures

  setup do
    company = company_fixture()
    champion = person_fixture(%{company_id: company.id})
    reviewer = person_fixture(%{company_id: company.id})
    group = group_fixture(champion, %{company_id: company.id})

    project = project_fixture(%{
      company_id: company.id,
      creator_id: champion.id,
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      group_id: group.id
    })

    {:ok, company: company, project: project, champion: champion, reviewer: reviewer, group: group}
  end

  describe "projects" do
    alias Operately.Projects.Project

    import Operately.ProjectsFixtures

    @invalid_attrs %{description: nil, name: nil}

    test "list_projects/0 returns all projects", ctx do
      assert Projects.list_projects(ctx.champion, %{}) == [ctx.project]
    end

    test "get_project!/1 returns the project with given id", ctx do
      assert Projects.get_project!(ctx.project.id) == ctx.project
    end

    test "create_project/2 with valid data creates a project", ctx do
      project_attrs = %Operately.Operations.ProjectCreation{
        name: "some name",
        company_id: ctx.company.id,
        group_id: ctx.group.id,
        champion_id: ctx.champion.id,
        reviewer_id: ctx.reviewer.id,
        creator_id: ctx.champion.id,
        company_access_level: Binding.view_access(),
        space_access_level: Binding.comment_access(),
      }

      assert {:ok, %Project{} = project} = Projects.create_project(project_attrs)
      assert project.name == "some name"

      assert nil != Operately.Access.get_context!(project_id: project.id)
    end

    test "create_project/2 creates project with default task statuses", ctx do
      project_attrs = %Operately.Operations.ProjectCreation{
        name: "project with defaults",
        company_id: ctx.company.id,
        group_id: ctx.group.id,
        champion_id: ctx.champion.id,
        reviewer_id: ctx.reviewer.id,
        creator_id: ctx.champion.id,
        company_access_level: Binding.view_access(),
        space_access_level: Binding.comment_access(),
      }

      assert {:ok, %Project{} = project} = Projects.create_project(project_attrs)

      # Verify project has 4 default task statuses
      assert length(project.task_statuses) == 4

      # Verify the default statuses are present
      statuses_by_value = Enum.group_by(project.task_statuses, & &1.value)
      assert Map.has_key?(statuses_by_value, "pending")
      assert Map.has_key?(statuses_by_value, "in_progress")
      assert Map.has_key?(statuses_by_value, "done")
      assert Map.has_key?(statuses_by_value, "canceled")

      # Verify specific properties
      pending = hd(statuses_by_value["pending"])
      assert pending.label == "Not started"
      assert pending.color == :gray
    end

    test "update_project/2 does not overwrite custom task statuses", ctx do
      custom_statuses = [
        %{
          id: "custom_todo",
          label: "Custom Todo",
          color: :gray,
          index: 0,
          value: "custom_todo",
          closed: false
        }
      ]

      assert {:ok, %Project{} = project_with_custom_statuses} =
               Projects.update_project(ctx.project, %{task_statuses: custom_statuses})

      assert Enum.map(project_with_custom_statuses.task_statuses, & &1.id) == ["custom_todo"]

      assert {:ok, %Project{} = updated_project} =
               Projects.update_project(project_with_custom_statuses, %{name: "some updated name"})

      assert updated_project.name == "some updated name"
      assert Enum.map(updated_project.task_statuses, & &1.id) == ["custom_todo"]
    end

    test "update_project/2 with valid data updates the project", ctx do
      update_attrs = %{name: "some updated name"}

      assert {:ok, %Project{} = project} = Projects.update_project(ctx.project, update_attrs)
      assert project.name == "some updated name"
    end

    test "update_project/2 with invalid data returns error changeset", ctx do
      assert {:error, %Ecto.Changeset{}} = Projects.update_project(ctx.project, @invalid_attrs)
      assert ctx.project == Projects.get_project!(ctx.project.id)
    end

    test "archive_project/1 archives the project", ctx do
      assert {:ok, project} = Projects.archive_project(ctx.champion, ctx.project)
      assert project.deleted_at != nil
    end

    test "change_project/1 returns a project changeset", ctx do
      assert %Ecto.Changeset{} = Projects.change_project(ctx.project)
    end

    test "outdated?/1 returns true if the project is outdated" do
      four_days_from_now = DateTime.utc_now() |> DateTime.add(4, :day)
      tomorrow =  DateTime.utc_now() |> DateTime.add(1, :day)
      yesterday = DateTime.utc_now() |> DateTime.add(-1, :day)
      four_days_ago = DateTime.utc_now() |> DateTime.add(-4, :day)
      last_week = DateTime.utc_now() |> DateTime.add(-7, :day)

      refute Projects.outdated?(%{deleted_at: nil, status: "active", next_check_in_scheduled_at: four_days_from_now, timeframe: nil})
      refute Projects.outdated?(%{deleted_at: nil, status: "active", next_check_in_scheduled_at: tomorrow, timeframe: nil})
      refute Projects.outdated?(%{deleted_at: nil, status: "active", next_check_in_scheduled_at: yesterday, timeframe: nil})
      assert Projects.outdated?(%{deleted_at: nil, status: "active", next_check_in_scheduled_at: four_days_ago, timeframe: nil})
      assert Projects.outdated?(%{deleted_at: nil, status: "active", next_check_in_scheduled_at: last_week, timeframe: nil})

      refute Projects.outdated?(%{deleted_at: nil, status: "closed", next_check_in_scheduled_at: last_week, timeframe: nil})
      refute Projects.outdated?(%{deleted_at: nil, status: "paused", next_check_in_scheduled_at: last_week, timeframe: nil})
      refute Projects.outdated?(%{deleted_at: yesterday, status: "active", next_check_in_scheduled_at: last_week, timeframe: nil})
    end

    test "outdated?/1 returns false if the project has not started yet" do
      last_week = DateTime.utc_now() |> DateTime.add(-7, :day)
      future_start = Date.utc_today() |> Date.add(7)
      past_start = Date.utc_today() |> Date.add(-7)

      # Project with future start date should not be outdated even with overdue check-in
      refute Projects.outdated?(%{
        deleted_at: nil,
        status: "active",
        next_check_in_scheduled_at: last_week,
        timeframe: %{contextual_start_date: %{date: future_start}}
      })

      # Project with past start date should be outdated with overdue check-in
      assert Projects.outdated?(%{
        deleted_at: nil,
        status: "active",
        next_check_in_scheduled_at: last_week,
        timeframe: %{contextual_start_date: %{date: past_start}}
      })

      # Project with nil start date should be outdated with overdue check-in
      assert Projects.outdated?(%{
        deleted_at: nil,
        status: "active",
        next_check_in_scheduled_at: last_week,
        timeframe: %{contextual_start_date: nil}
      })
    end
  end

  describe "project_milestones" do
    alias Operately.Projects.Milestone

    import Operately.ProjectsFixtures

    @invalid_attrs %{timeframe: nil, title: nil}

    setup ctx do
      # Projects are automatically assigned some milestones. I clean them up here
      # so that I can test the create_milestone/1 function
      Operately.Repo.delete_all(Milestone)

      milestone = milestone_fixture(%{project_id: ctx.project.id})

      {:ok, milestone: milestone}
    end

    test "list_project_milestones/1 returns all project_milestones", ctx do
      assert Projects.list_project_milestones(ctx.project) == [ctx.milestone]
    end

    test "get_milestone!/1 returns the milestone with given id", ctx do
      assert Projects.get_milestone!(ctx.milestone.id) == ctx.milestone
    end

    test "update_milestone/2 with valid data updates the milestone", ctx do
      update_attrs = %{
        timeframe: %{
          contextual_start_date: ContextualDate.create_day_date(Date.utc_today()),
          contextual_end_date: ContextualDate.create_day_date(~D[2023-06-17]),
        },
        title: "some updated title"
      }

      assert {:ok, %Milestone{} = milestone} = Projects.update_milestone(ctx.milestone, update_attrs)
      assert milestone.timeframe.contextual_end_date.date == ~D[2023-06-17]
      assert milestone.title == "some updated title"
    end

    test "update_milestone/2 with invalid data returns error changeset", ctx do
      assert {:error, %Ecto.Changeset{}} = Projects.update_milestone(ctx.milestone, @invalid_attrs)
      assert ctx.milestone == Projects.get_milestone!(ctx.milestone.id)
    end

    test "change_milestone/1 returns a milestone changeset", ctx do
      assert %Ecto.Changeset{} = Projects.change_milestone(ctx.milestone)
    end
  end

  describe "project_contributors" do
    alias Operately.Projects.Contributor

    setup ctx do
      contributor = contributor_fixture(ctx.champion, %{
        project_id: ctx.project.id,
        person_id: ctx.champion.id
      })

      {:ok, contributor: contributor}
    end

    test "list_project_contributors/0 returns all project_contributors", ctx do
      assert Projects.list_project_contributors(ctx.project) |> Enum.find(fn c -> c.id == ctx.contributor.id end)
    end

    test "get_contributor!/1 returns the contributor with given id", ctx do
      assert Projects.get_contributor!(ctx.contributor.id) == ctx.contributor
    end

    test "create_contributor/2 with valid data creates a contributor", ctx do
      valid_attrs = %{
        project_id: ctx.project.id,
        person_id: ctx.champion.id,
        responsibility: "some responsibility",
        permissions: Binding.edit_access()
      }

      assert {:ok, %Contributor{} = contributor} = Projects.create_contributor(ctx.champion, valid_attrs)
      assert contributor.responsibility == "some responsibility"
    end

    test "update_contributor/2 with valid data updates the contributor", ctx do
      update_attrs = %{responsibility: "some updated responsibility"}

      assert {:ok, %Contributor{} = contributor} = Projects.update_contributor(ctx.contributor, update_attrs)
      assert contributor.responsibility == "some updated responsibility"
    end

    test "delete_contributor/1 deletes the contributor", ctx do
      assert {:ok, %Contributor{}} = Projects.delete_contributor(ctx.contributor)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_contributor!(ctx.contributor.id) end
    end

    test "change_contributor/1 returns a contributor changeset", ctx do
      assert %Ecto.Changeset{} = Projects.change_contributor(ctx.contributor)
    end
  end

  describe "Project.set_next_milestone/1 and next_step/1" do
    alias Operately.Projects.{Milestone, Project}
    alias OperatelyWeb.Paths

    defp milestone_without_due_date(project, title) do
      milestone_fixture(%{
        project_id: project.id,
        creator_id: project.creator_id,
        title: title,
        timeframe: %{}
      })
    end

    defp milestone_with_due_date(project, title, due_date) do
      milestone_fixture(%{
        project_id: project.id,
        creator_id: project.creator_id,
        title: title,
        timeframe: %{
          contextual_end_date: ContextualDate.create_day_date(due_date)
        }
      })
    end

    defp load_project_with_milestones(project, ordering_state) do
      {:ok, project} = Projects.update_project(project, %{milestones_ordering_state: ordering_state})

      project
      |> Operately.Repo.preload(:milestones)
      |> Project.after_load_hooks()
    end

    test "picks first pending milestone by ordering state when milestones have no due dates", ctx do
      first = milestone_without_due_date(ctx.project, "First")
      second = milestone_without_due_date(ctx.project, "Second")
      third = milestone_without_due_date(ctx.project, "Third")

      ordering = [Paths.milestone_id(third), Paths.milestone_id(first), Paths.milestone_id(second)]

      project =
        load_project_with_milestones(ctx.project, ordering)

      assert Project.next_step(project) == "Third"
      assert project.next_milestone.id == third.id
    end

    test "picks first pending milestone when earlier milestones are done", ctx do
      first = milestone_without_due_date(ctx.project, "First")
      second = milestone_without_due_date(ctx.project, "Second")
      {:ok, _} = Milestone.set_status(second, :done)

      ordering = [Paths.milestone_id(second), Paths.milestone_id(first)]

      project =
        load_project_with_milestones(ctx.project, ordering)

      assert Project.next_step(project) == "First"
      assert project.next_milestone.id == first.id
    end

    test "dated milestones sort by due date and undated milestones use ordering state", ctx do
      undated_first = milestone_without_due_date(ctx.project, "Undated First")
      dated_later = milestone_with_due_date(ctx.project, "Dated Later", ~D[2025-06-01])
      undated_second = milestone_without_due_date(ctx.project, "Undated Second")

      ordering = [
        Paths.milestone_id(undated_first),
        Paths.milestone_id(dated_later),
        Paths.milestone_id(undated_second)
      ]

      project =
        load_project_with_milestones(ctx.project, ordering)

      assert Project.next_step(project) == "Dated Later"
      assert project.next_milestone.id == dated_later.id
    end

    test "breaks ties on equal due dates using ordering state", ctx do
      later_in_order = milestone_with_due_date(ctx.project, "Later in order", ~D[2025-06-01])
      earlier_in_order = milestone_with_due_date(ctx.project, "Earlier in order", ~D[2025-06-01])

      ordering = [Paths.milestone_id(earlier_in_order), Paths.milestone_id(later_in_order)]

      project =
        load_project_with_milestones(ctx.project, ordering)

      assert Project.next_step(project) == "Earlier in order"
      assert project.next_milestone.id == earlier_in_order.id
    end

    test "returns empty string when all milestones are done", ctx do
      first = milestone_without_due_date(ctx.project, "First")
      {:ok, _} = Milestone.set_status(first, :done)

      project =
        load_project_with_milestones(ctx.project, [Paths.milestone_id(first)])

      assert Project.next_step(project) == ""
      assert is_nil(project.next_milestone)
    end
  end
end
