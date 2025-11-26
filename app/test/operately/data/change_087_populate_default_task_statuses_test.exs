defmodule Operately.Data.Change087PopulateDefaultTaskStatusesTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.Projects.Project
  alias Operately.Data.Change087PopulateDefaultTaskStatuses

  setup ctx do
    Factory.setup(ctx)
  end

  test "populates task_statuses for projects with nil task_statuses", ctx do
    # Create a project with nil task_statuses
    # Note: Ecto defaults embedded fields to [] when not provided
    project = create_project_with_task_statuses(ctx, nil)

    assert project.task_statuses == []

    Change087PopulateDefaultTaskStatuses.run()

    updated_project = Repo.get!(Project, project.id)
    assert length(updated_project.task_statuses) == 4
    assert_default_task_statuses(updated_project.task_statuses)
  end

  test "populates task_statuses for projects with empty list", ctx do
    # Create a project with empty task_statuses
    project = create_project_with_task_statuses(ctx, [])

    assert project.task_statuses == []

    Change087PopulateDefaultTaskStatuses.run()

    updated_project = Repo.get!(Project, project.id)
    assert length(updated_project.task_statuses) == 4
    assert_default_task_statuses(updated_project.task_statuses)
  end

  test "does not modify projects that already have task_statuses", ctx do
    # Create a project with custom task_statuses
    custom_statuses = [
      %{
        id: Ecto.UUID.generate(),
        label: "Custom Status",
        color: :blue,
        value: "custom",
        index: 0,
        closed: false
      }
    ]

    project = create_project_with_task_statuses(ctx, custom_statuses)

    assert length(project.task_statuses) == 1
    assert hd(project.task_statuses).label == "Custom Status"

    Change087PopulateDefaultTaskStatuses.run()

    updated_project = Repo.get!(Project, project.id)
    assert length(updated_project.task_statuses) == 1
    assert hd(updated_project.task_statuses).label == "Custom Status"
  end

  test "handles multiple projects with mixed states", ctx do
    # Create projects with different task_statuses states
    project_nil = create_project_with_task_statuses(ctx, nil)
    project_empty = create_project_with_task_statuses(ctx, [])
    project_custom = create_project_with_task_statuses(ctx, [
      %{
        id: Ecto.UUID.generate(),
        label: "Existing",
        color: :red,
        value: "existing",
        index: 0,
        closed: false
      }
    ])

    Change087PopulateDefaultTaskStatuses.run()

    # Projects with nil or empty should now have defaults
    updated_nil = Repo.get!(Project, project_nil.id)
    assert length(updated_nil.task_statuses) == 4

    updated_empty = Repo.get!(Project, project_empty.id)
    assert length(updated_empty.task_statuses) == 4

    # Project with custom statuses should be unchanged
    updated_custom = Repo.get!(Project, project_custom.id)
    assert length(updated_custom.task_statuses) == 1
    assert hd(updated_custom.task_statuses).label == "Existing"
  end

  defp create_project_with_task_statuses(ctx, task_statuses) do
    # Create a subscription list first
    {:ok, subscription_list} =
      Repo.insert(%Operately.Notifications.SubscriptionList{
        parent_type: :project
      })

    attrs = %{
      name: "Test Project #{Ecto.UUID.generate()}",
      company_id: ctx.company.id,
      group_id: ctx.company.company_space_id,
      creator_id: ctx.creator.id,
      subscription_list_id: subscription_list.id
    }

    # Only add task_statuses if it's not nil (to test nil case properly)
    attrs = if task_statuses == nil do
      attrs
    else
      Map.put(attrs, :task_statuses, task_statuses)
    end

    {:ok, project} = Repo.insert(Project.changeset(attrs))

    project
  end

  defp assert_default_task_statuses(task_statuses) do
    # Check that we have the expected default statuses
    statuses_by_value = Enum.group_by(task_statuses, & &1.value)

    assert Map.has_key?(statuses_by_value, "pending")
    assert Map.has_key?(statuses_by_value, "in_progress")
    assert Map.has_key?(statuses_by_value, "done")
    assert Map.has_key?(statuses_by_value, "canceled")

    # Check specific properties of each status
    pending = hd(statuses_by_value["pending"])
    assert pending.label == "Not started"
    assert pending.color == :gray
    assert pending.index == 0
    assert pending.closed == false

    in_progress = hd(statuses_by_value["in_progress"])
    assert in_progress.label == "In progress"
    assert in_progress.color == :blue
    assert in_progress.index == 1
    assert in_progress.closed == false

    done = hd(statuses_by_value["done"])
    assert done.label == "Done"
    assert done.color == :green
    assert done.index == 2
    assert done.closed == true

    canceled = hd(statuses_by_value["canceled"])
    assert canceled.label == "Canceled"
    assert canceled.color == :red
    assert canceled.index == 3
    assert canceled.closed == true
  end
end
