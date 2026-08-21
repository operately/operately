defmodule Operately.ProjectTemplates.ProjectTemplateTest do
  use Operately.DataCase

  alias Operately.ProjectTemplates.ProjectTemplate
  alias Operately.Notifications.SubscriptionList
  alias Operately.People.Person
  alias Operately.Projects.Project
  alias Operately.Tasks.KanbanState

  setup do
    ctx =
      Factory.setup(%{})
      |> Factory.add_space(:space)

    {:ok, ctx}
  end

  test "stores reusable root fields and initializes workflow defaults", ctx do
    changeset =
      ProjectTemplate.changeset(%{
        company_id: ctx.company.id,
        space_id: ctx.space.id,
        creator_id: ctx.creator.id,
        name: "Launch template",
        description: %{"type" => "doc", "content" => []},
        duration_days: 0
      })

    assert changeset.valid?

    template = Repo.insert!(changeset)

    assert template.duration_days == 0
    assert length(template.task_statuses) == 4
    assert template.milestones_ordering_state == []
    assert template.tasks_kanban_state == KanbanState.initialize()
    assert template.archived_at == nil
    assert Repo.get(Project, template.id) == nil
    assert Project.get(:system, id: template.id) == {:error, :not_found}
  end

  test "requires ownership, creator, and name" do
    changeset = ProjectTemplate.changeset(%{})

    assert errors_on(changeset) == %{
             company_id: ["can't be blank"],
             creator_id: ["can't be blank"],
             name: ["can't be blank"],
             space_id: ["can't be blank"]
           }
  end

  test "accepts an unscheduled duration and rejects negative durations", ctx do
    valid_attrs = %{
      company_id: ctx.company.id,
      space_id: ctx.space.id,
      creator_id: ctx.creator.id,
      name: "Template"
    }

    assert ProjectTemplate.changeset(valid_attrs).valid?

    changeset = ProjectTemplate.changeset(Map.put(valid_attrs, :duration_days, -1))
    assert errors_on(changeset) == %{duration_days: ["must be greater than or equal to 0"]}
  end

  test "enforces the duration constraint in the database", ctx do
    template = Factory.add_project_template(ctx, :template, :space).template

    assert_raise Ecto.ConstraintError, ~r/project_templates_duration_days_non_negative/, fn ->
      template
      |> change(duration_days: -1)
      |> Repo.update!()
    end
  end

  test "hard deletion cascades to core template children", ctx do
    ctx =
      ctx
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_milestone(:milestone, :template)
      |> Factory.add_project_template_task(:task, :template, milestone: :milestone)

    Repo.delete!(ctx.template)

    assert Repo.get(Operately.ProjectTemplates.Milestone, ctx.milestone.id) == nil
    assert Repo.get(Operately.ProjectTemplates.Task, ctx.task.id) == nil
  end

  test "deleting a source project nullifies template provenance", ctx do
    source_project = insert_bare_project(ctx)

    ctx =
      ctx
      |> Map.put(:source_project, source_project)
      |> Factory.add_project_template(:template, :space, source_project: :source_project)

    Repo.delete!(ctx.source_project)

    assert Repo.get!(ProjectTemplate, ctx.template.id).source_project_id == nil
  end

  test "deleting a template nullifies generated-project provenance", ctx do
    ctx =
      ctx
      |> Factory.add_project(:generated_project, :space)
      |> Factory.add_project_template(:template, :space)

    ctx.generated_project
    |> Project.changeset(%{source_template_id: ctx.template.id})
    |> Repo.update!()

    Repo.delete!(ctx.template)

    assert Repo.get!(Project, ctx.generated_project.id).source_template_id == nil
  end

  test "deleting the creator preserves the template", ctx do
    creator = Repo.insert!(Person.changeset(%{company_id: ctx.company.id, full_name: "Template Creator"}))

    ctx =
      ctx
      |> Map.put(:template_creator, creator)
      |> Factory.add_project_template(:template, :space, creator: :template_creator)

    Repo.delete!(creator)

    assert Repo.get!(ProjectTemplate, ctx.template.id).creator_id == nil
  end

  defp insert_bare_project(ctx) do
    subscription_list = Repo.insert!(SubscriptionList.changeset(%{}))

    Repo.insert!(
      Project.changeset(%{
        company_id: ctx.company.id,
        group_id: ctx.space.id,
        creator_id: ctx.creator.id,
        subscription_list_id: subscription_list.id,
        name: "Source project"
      })
    )
  end
end
