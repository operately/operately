defmodule Operately.ProjectTemplates.MilestoneTest do
  use Operately.DataCase

  alias Operately.ProjectTemplates.Milestone
  alias Operately.Projects
  alias Operately.Tasks.{KanbanState, OrderingState}

  setup do
    ctx =
      Factory.setup(%{})
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space)

    {:ok, ctx}
  end

  test "stores reusable milestone fields and initializes ordering", ctx do
    changeset =
      Milestone.changeset(%{
        project_template_id: ctx.template.id,
        title: "Launch",
        description: %{"type" => "doc", "content" => []},
        due_offset_days: 0
      })

    assert changeset.valid?

    milestone = Repo.insert!(changeset)

    assert milestone.due_offset_days == 0
    assert milestone.tasks_ordering_state == OrderingState.initialize()
    assert milestone.tasks_kanban_state == KanbanState.initialize()
    assert Repo.get(Projects.Milestone, milestone.id) == nil
    assert Projects.Milestone.get(:system, id: milestone.id) == {:error, :not_found}
  end

  test "requires template ownership and title" do
    changeset = Milestone.changeset(%{})

    assert errors_on(changeset) == %{
             project_template_id: ["can't be blank"],
             title: ["can't be blank"]
           }
  end

  test "accepts an unscheduled due date and rejects negative offsets", ctx do
    assert Milestone.changeset(%{project_template_id: ctx.template.id, title: "Launch"}).valid?

    changeset = Milestone.changeset(%{project_template_id: ctx.template.id, title: "Launch", due_offset_days: -1})
    assert errors_on(changeset) == %{due_offset_days: ["must be greater than or equal to 0"]}
  end

  test "enforces the due offset constraint in the database", ctx do
    milestone = Factory.add_project_template_milestone(ctx, :milestone, :template).milestone

    assert_raise Ecto.ConstraintError, ~r/project_template_milestones_due_offset_days_non_negative/, fn ->
      milestone
      |> change(due_offset_days: -1)
      |> Repo.update!()
    end
  end
end
