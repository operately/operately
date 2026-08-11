defmodule Operately.Operations.ProjectTemplateMaterializationTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias Operately.Comments.CommentThread
  alias Operately.ContextualDates.Timeframe
  alias Operately.Notifications.{Subscription, SubscriptionList}
  alias Operately.Operations.{ProjectCreation, ProjectTemplateMaterialization}
  alias Operately.ProjectTemplates.{Person, ProjectTemplate, TaskAssignment}
  alias Operately.Projects.{Contributor, Milestone, Project}
  alias Operately.Repo
  alias Operately.ResourceHubs.ResourceHub
  alias Operately.Support.Factory
  alias Operately.Tasks.{Reminder, Status, Task}
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_company_member(:champion)
    |> Factory.add_company_member(:reviewer)
    |> Factory.add_goal(:goal, :space)
  end

  test "materializes an independent core graph with dates, workflow, ordering, and reminders", ctx do
    [not_started, done] = statuses()

    ctx =
      ctx
      |> Factory.add_project_template(:template, :space,
        name: "Reusable launch",
        description: %{"type" => "doc", "content" => []},
        duration_days: 30,
        task_statuses: status_attrs([not_started, done])
      )
      |> Factory.add_project_template_milestone(:launch, :template,
        title: "Launch",
        description: %{"type" => "doc", "content" => []},
        due_offset_days: 14
      )
      |> Factory.add_project_template_task(:root_task, :template,
        name: "Prepare brief",
        description: %{"type" => "doc", "content" => []},
        priority: "high",
        size: "medium",
        due_offset_days: 0,
        reminders: [%{type: :before_due, days: 2}],
        task_status: Map.from_struct(done)
      )
      |> Factory.add_project_template_task(:root_open_task, :template,
        name: "Collect inputs",
        task_status: Map.from_struct(not_started)
      )
      |> Factory.add_project_template_task(:milestone_task, :template,
        milestone: :launch,
        name: "Publish",
        description: %{"type" => "doc", "content" => []},
        due_offset_days: 16,
        task_status: Map.from_struct(done)
      )
      |> Factory.add_project_template_task(:milestone_open_task, :template,
        milestone: :launch,
        name: "Review",
        task_status: Map.from_struct(not_started)
      )
      |> put_template_states(not_started, done)

    assert {:ok, project} = materialize(ctx, ~D[2028-02-15])

    project = Repo.preload(project, [:milestones, :tasks, :resource_hub])
    [milestone] = project.milestones
    root_open_task = Enum.find(project.tasks, &(&1.name == "Collect inputs"))
    root_task = Enum.find(project.tasks, &(&1.name == "Prepare brief"))
    milestone_open_task = Enum.find(project.tasks, &(&1.name == "Review"))
    milestone_task = Enum.find(project.tasks, &(&1.name == "Publish"))

    assert project.name == "Generated launch"
    assert project.description == ctx.template.description
    assert project.goal_id == ctx.goal.id
    assert project.source_template_id == ctx.template.id
    assert Timeframe.start_date(project.timeframe) == ~D[2028-02-15]
    assert Timeframe.end_date(project.timeframe) == ~D[2028-03-16]
    assert project.health == :on_track
    assert project.status == "active"
    assert project.closed_at == nil
    assert project.success_status == nil
    assert project.last_check_in_id == nil
    assert project.resource_hub.name == "Documents & Files"

    assert milestone.id != ctx.launch.id
    assert milestone.title == "Launch"
    assert milestone.status == :pending
    assert milestone.completed_at == nil
    assert Timeframe.end_date(milestone.timeframe) == ~D[2028-02-29]

    assert root_task.id != ctx.root_task.id
    assert root_task.name == "Prepare brief"
    assert root_task.priority == "high"
    assert root_task.size == "medium"
    assert root_task.due_date.date == ~D[2028-02-15]
    assert [%{type: :before_due, days: 2}] = root_task.reminders
    assert milestone_task.due_date.date == ~D[2028-03-02]

    copied_status = Enum.find(project.task_statuses, &(&1.value == not_started.value))
    refute copied_status.id in Enum.map(ctx.template.task_statuses, & &1.id)
    assert Enum.all?(project.tasks, &(&1.task_status.id == copied_status.id))
    assert Enum.all?(project.tasks, &(is_nil(&1.closed_at) and is_nil(&1.reopened_at)))

    assert project.milestones_ordering_state == [Paths.milestone_id(milestone)]
    assert project.tasks_kanban_state[copied_status.value] == [Paths.task_id(root_open_task), Paths.task_id(root_task)]
    assert milestone.tasks_ordering_state == [Paths.task_id(milestone_task), Paths.task_id(milestone_open_task)]
    assert milestone.tasks_kanban_state[copied_status.value] == [Paths.task_id(milestone_open_task), Paths.task_id(milestone_task)]
  end

  test "materializes nil and zero offsets and handles leap and year boundaries", ctx do
    ctx =
      ctx
      |> Factory.add_project_template(:template, :space, duration_days: 0)
      |> Factory.add_project_template_milestone(:dated, :template, due_offset_days: 0)
      |> Factory.add_project_template_milestone(:undated, :template)
      |> Factory.add_project_template_task(:dated_task, :template, due_offset_days: 1)
      |> Factory.add_project_template_task(:undated_task, :template)

    assert {:ok, project} = materialize(ctx, ~D[2028-12-31])
    project = Repo.preload(project, [:milestones, :tasks])

    assert Timeframe.end_date(project.timeframe) == ~D[2028-12-31]
    assert Enum.find(project.milestones, &(&1.title == ctx.dated.title)).timeframe.contextual_end_date.date == ~D[2028-12-31]
    assert Enum.find(project.milestones, &(&1.title == ctx.undated.title)).timeframe.contextual_end_date == nil
    assert Enum.find(project.tasks, &(&1.name == ctx.dated_task.name)).due_date.date == ~D[2029-01-01]
    assert Enum.find(project.tasks, &(&1.name == ctx.undated_task.name)).due_date == nil
  end

  test "materializes template Docs & Files as independent published runtime resources", ctx do
    ctx =
      ctx
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_resource_folder(:folder, :template, name: "Launch assets")
      |> Factory.add_project_template_resource_document(:document, :template,
        parent_folder: :folder,
        position: 0,
        name: "Launch plan",
        content: %{"type" => "doc", "content" => []}
      )
      |> Factory.add_blob(:blob)
      |> Factory.add_project_template_resource_file(:file, :template, :blob, parent_folder: :folder, position: 1, name: "Launch file")
      |> Factory.add_project_template_resource_link(:link, :template, parent_folder: :folder, position: 2, name: "Launch link")

    assert {:ok, project} = materialize(ctx, ~D[2028-01-01])

    hub = Repo.preload(project, :resource_hub).resource_hub

    nodes =
      Repo.all(from node in Operately.ResourceHubs.Node, where: node.resource_hub_id == ^hub.id)
      |> Repo.preload([:folder, :document, :file, :link])

    [folder_node] = Enum.filter(nodes, &(&1.type == :folder))
    [document_node] = Enum.filter(nodes, &(&1.type == :document))
    document = document_node.document

    assert folder_node.folder.name == "Launch assets"
    assert document.name == "Launch plan"
    assert document.content == %{"type" => "doc", "content" => []}
    assert document.state == :published
    assert document.current_version == 1
    assert document_node.parent_folder_id == folder_node.folder.id
    assert document_node.id != ctx.document.node_id
    assert Repo.aggregate(from(version in Operately.ResourceHubs.DocumentVersion, where: version.document_id == ^document.id), :count) == 1
    assert Repo.get_by!(SubscriptionList, parent_id: document.id, parent_type: :resource_hub_document)
    assert Enum.any?(nodes, &(&1.file && &1.file.name == "Launch file" && &1.file.blob_id == ctx.blob.id))
    assert Enum.any?(nodes, &(&1.link && &1.link.name == "Launch link"))
  end

  test "uses creation access baselines and creates only normal runtime side effects", ctx do
    ctx =
      ctx
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_person(:template_champion, :template, :champion,
        role: :champion,
        access_level: Binding.full_access()
      )
      |> Factory.add_project_template_milestone(:milestone, :template)
      |> Factory.add_project_template_task(:task, :template, milestone: :milestone)

    assert {:ok, project} = materialize(ctx, ~D[2028-01-01])
    [milestone] = Repo.all(from m in Milestone, where: m.project_id == ^project.id)
    [task] = Repo.all(from t in Task, where: t.project_id == ^project.id)
    context = Access.get_context!(project_id: project.id)

    company_members = Access.get_group!(company_id: ctx.company.id, tag: :standard)
    space_members = Access.get_group!(group_id: ctx.space.id, tag: :standard)

    assert Access.get_binding(group_id: company_members.id, context_id: context.id, access_level: Binding.comment_access())
    assert Access.get_binding(group_id: space_members.id, context_id: context.id, access_level: Binding.edit_access())

    assert Repo.aggregate(from(a in Activity, where: a.action == "project_created" and a.content["project_id"] == ^project.id), :count) == 1
    assert Repo.aggregate(from(a in Activity, where: a.content["project_id"] == ^project.id and a.action != "project_created"), :count) == 0
    assert Repo.get_by!(SubscriptionList, parent_id: milestone.id, parent_type: :project_milestone)
    assert Repo.get_by!(SubscriptionList, parent_id: task.id, parent_type: :project_task)
    assert {:ok, _} = Subscription.get(:system, subscription_list_id: milestone.subscription_list_id, person_id: ctx.creator.id)
    assert {:ok, _} = Subscription.get(:system, subscription_list_id: milestone.subscription_list_id, person_id: ctx.champion.id)
    assert {:ok, _} = Subscription.get(:system, subscription_list_id: task.subscription_list_id, person_id: ctx.creator.id)
    assert Repo.aggregate(from(r in ResourceHub, where: r.project_id == ^project.id), :count) == 1
  end

  test "materializes discussions with fresh subscription lists and falls back to the project creator", ctx do
    ctx = ctx |> Factory.add_company_member(:unavailable) |> Factory.add_project_template(:template, :space)

    ctx =
      ctx
      |> Factory.add_project_template_discussion(:newest, :template, title: "Newest", position: 0)
      |> Factory.add_project_template_discussion(:older, :template, title: "Older", position: 1, author: ctx.unavailable)
      |> Factory.suspend_company_member(:unavailable)

    assert {:ok, project} = materialize(ctx, ~D[2028-01-01])

    discussions = Repo.all(from d in CommentThread, where: d.parent_type == :project and d.parent_id == ^project.id, order_by: [desc: d.inserted_at])

    assert Enum.map(discussions, & &1.title) == ["Newest", "Older"]
    assert Enum.all?(discussions, &(&1.id not in [ctx.newest.id, ctx.older.id]))
    assert Enum.all?(discussions, &(&1.subscription_list_id != nil))
    assert Enum.find(discussions, &(&1.title == "Newest")).author_id == ctx.creator.id
    assert Enum.find(discussions, &(&1.title == "Older")).author_id == ctx.creator.id
    assert Repo.aggregate(from(a in Activity, where: a.comment_thread_id in ^Enum.map(discussions, & &1.id)), :count) == 0
  end

  test "restores active roles and assignments while skipping inactive people", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:contributor)
      |> Factory.add_company_member(:inactive)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_task(:task, :template)
      |> Factory.add_project_template_person(:template_champion, :template, :champion,
        role: :champion,
        responsibility: "Leads",
        access_level: Binding.view_access()
      )
      |> Factory.add_project_template_person(:template_reviewer, :template, :reviewer,
        role: :reviewer,
        access_level: Binding.full_access()
      )
      |> Factory.add_project_template_person(:template_contributor, :template, :contributor,
        responsibility: "Advises",
        access_level: Binding.comment_access()
      )
      |> Factory.add_project_template_person(:template_inactive, :template, :inactive,
        role: :contributor,
        access_level: Binding.edit_access()
      )
      |> Factory.add_project_template_task_assignment(:active_assignment, :template, :task, :template_contributor)
      |> Factory.add_project_template_task_assignment(:inactive_assignment, :template, :task, :template_inactive)
      |> Factory.suspend_company_member(:inactive)

    assert {:ok, project} = materialize(ctx, ~D[2028-01-01])

    contributors = Repo.all(from(c in Contributor, where: c.project_id == ^project.id))
    champion = Enum.find(contributors, &(&1.person_id == ctx.champion.id))
    reviewer = Enum.find(contributors, &(&1.person_id == ctx.reviewer.id))
    contributor = Enum.find(contributors, &(&1.person_id == ctx.contributor.id))

    assert champion.role == :champion
    assert champion.responsibility == "Leads"
    assert reviewer.role == :reviewer
    assert contributor.role == :contributor
    assert contributor.responsibility == "Advises"
    refute Enum.any?(contributors, &(&1.person_id == ctx.inactive.id))

    context = Access.get_context!(project_id: project.id)
    champion_group = Access.get_group!(person_id: ctx.champion.id)
    contributor_group = Access.get_group!(person_id: ctx.contributor.id)

    assert Access.get_binding(context_id: context.id, group_id: champion_group.id).access_level == Binding.full_access()
    assert Access.get_binding(context_id: context.id, group_id: contributor_group.id).access_level == Binding.edit_access()

    [task] = Repo.all(from(t in Task, where: t.project_id == ^project.id))
    assert Repo.get_by!(Operately.Tasks.Assignee, task_id: task.id, person_id: ctx.contributor.id)
    refute Repo.get_by(Operately.Tasks.Assignee, task_id: task.id, person_id: ctx.inactive.id)
    assert {:ok, _subscription} = Subscription.get(:system, subscription_list_id: task.subscription_list_id, person_id: ctx.contributor.id)
  end

  test "uses a replaced contributor's latest details and task assignment", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:former_contributor)
      |> Factory.add_company_member(:replacement)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_task(:task, :template)
      |> Factory.add_project_template_person(:template_person, :template, :former_contributor,
        responsibility: "Original responsibility",
        access_level: Binding.comment_access()
      )
      |> Factory.add_project_template_task_assignment(:assignment, :template, :task, :template_person)

    ctx.template_person
    |> Person.changeset(%{
      person_id: ctx.replacement.id,
      responsibility: "Own launch messaging",
      access_level: Binding.full_access()
    })
    |> Repo.update!()

    assert {:ok, project} = materialize(ctx, ~D[2028-01-01])

    contributor = Repo.get_by!(Contributor, project_id: project.id, person_id: ctx.replacement.id)
    context = Access.get_context!(project_id: project.id)
    replacement_group = Access.get_group!(person_id: ctx.replacement.id)
    [task] = Repo.all(from t in Task, where: t.project_id == ^project.id)

    assert contributor.role == :contributor
    assert contributor.responsibility == "Own launch messaging"
    assert Access.get_binding(context_id: context.id, group_id: replacement_group.id).access_level == Binding.full_access()
    assert Repo.get_by!(Operately.Tasks.Assignee, task_id: task.id, person_id: ctx.replacement.id)
    refute Repo.get_by(Contributor, project_id: project.id, person_id: ctx.former_contributor.id)
  end

  test "rejects missing dates, inactive templates, and workflows without an open status", ctx do
    ctx = Factory.add_project_template(ctx, :template, :space)

    assert {:error, :start_date_required} = materialize(ctx, nil)

    archived = ctx.template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update!()
    assert {:error, :template_not_active} = materialize(%{ctx | template: archived}, ~D[2028-01-01])

    [_, closed] = statuses()
    active = archived |> ProjectTemplate.changeset(%{archived_at: nil, task_statuses: status_attrs([closed])}) |> Repo.update!()
    assert {:error, {:invalid_template, :no_open_task_status}} = materialize(%{ctx | template: active}, ~D[2028-01-01])
  end

  test "rejects cross-Space templates and malformed ordering and Kanban state", ctx do
    ctx =
      ctx
      |> Factory.add_space(:other_space)
      |> Factory.add_project_template(:other_template, :other_space)

    assert {:error, :template_scope_mismatch} = materialize(Map.put(ctx, :template, ctx.other_template), ~D[2028-01-01])

    ctx =
      ctx
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_milestone(:milestone, :template)

    milestone_id = Paths.project_template_milestone_id(ctx.milestone)
    template = ctx.template |> ProjectTemplate.changeset(%{milestones_ordering_state: [milestone_id, milestone_id]}) |> Repo.update!()

    assert {:error, {:invalid_template, :duplicate_ordering_id}} = materialize(%{ctx | template: template}, ~D[2028-01-01])

    template = template |> ProjectTemplate.changeset(%{milestones_ordering_state: [milestone_id], tasks_kanban_state: %{"unknown" => []}}) |> Repo.update!()
    assert {:error, {:invalid_template, :unknown_kanban_status}} = materialize(%{ctx | template: template}, ~D[2028-01-01])
  end

  test "rejects foreign and duplicate assignment references", ctx do
    ctx =
      ctx
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_task(:task, :template)
      |> Factory.add_project_template_person(:template_person, :template, :champion)
      |> Factory.add_project_template(:other_template, :space)
      |> Factory.add_project_template_task(:other_task, :other_template)

    foreign_assignment =
      %{
        project_template_id: ctx.template.id,
        project_template_task_id: ctx.other_task.id,
        project_template_person_id: ctx.template_person.id
      }
      |> TaskAssignment.changeset()
      |> Repo.insert!()

    assert {:error, {:invalid_template, :foreign_assignment_reference}} = materialize(ctx, ~D[2028-01-01])
    Repo.delete!(foreign_assignment)

    assignment_attrs = %{
      project_template_id: ctx.template.id,
      project_template_task_id: ctx.task.id,
      project_template_person_id: ctx.template_person.id
    }

    Repo.insert!(TaskAssignment.changeset(assignment_attrs))
    Repo.insert!(TaskAssignment.changeset(assignment_attrs))

    assert {:error, {:invalid_template, :duplicate_assignment}} = materialize(ctx, ~D[2028-01-01])
  end

  test "later template edits and deletion do not change the generated graph", ctx do
    ctx =
      ctx
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_task(:task, :template, name: "Original task")

    assert {:ok, project} = materialize(ctx, ~D[2028-01-01])
    [generated_task] = Repo.all(from t in Task, where: t.project_id == ^project.id)

    ctx.task |> Operately.ProjectTemplates.Task.changeset(%{name: "Changed template task"}) |> Repo.update!()
    assert Repo.reload!(generated_task).name == "Original task"

    Repo.delete!(ctx.template)
    assert Repo.reload!(project).source_template_id == nil
    assert Repo.reload!(generated_task).name == "Original task"
  end

  test "rolls back every runtime row when a child is invalid", ctx do
    ctx =
      ctx
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_task(:task, :template)

    from(t in Operately.ProjectTemplates.Task, where: t.id == ^ctx.task.id)
    |> Repo.update_all(set: [reminders: [%Reminder{type: :on_date, date: ~D[2028-01-01]}]])

    before_projects = Repo.aggregate(Project, :count)
    before_activities = Repo.aggregate(Activity, :count)
    before_lists = Repo.aggregate(SubscriptionList, :count)

    assert {:error, {:invalid_child, :task, _changeset}} = materialize(ctx, ~D[2028-01-01])
    assert Repo.aggregate(Project, :count) == before_projects
    assert Repo.aggregate(Activity, :count) == before_activities
    assert Repo.aggregate(SubscriptionList, :count) == before_lists
  end

  defp materialize(ctx, start_date) do
    ProjectTemplateMaterialization.run(%ProjectTemplateMaterialization{
      template_id: ctx.template.id,
      start_date: start_date,
      project: %ProjectCreation{
        company_id: ctx.company.id,
        group_id: ctx.space.id,
        name: "Generated launch",
        champion_id: ctx.champion.id,
        reviewer_id: ctx.reviewer.id,
        creator_id: ctx.creator.id,
        creator_role: "Contributor",
        visibility: "everyone",
        goal_id: ctx.goal.id,
        anonymous_access_level: Binding.no_access(),
        company_access_level: Binding.comment_access(),
        space_access_level: Binding.edit_access()
      }
    })
  end

  defp statuses do
    [
      %Status{id: Ecto.UUID.generate(), label: "Queued", color: :gray, value: "queued", index: 0, closed: false},
      %Status{id: Ecto.UUID.generate(), label: "Done", color: :green, value: "done", index: 1, closed: true}
    ]
  end

  defp status_attrs(statuses), do: Enum.map(statuses, &Map.from_struct/1)

  defp put_template_states(ctx, not_started, done) do
    template =
      ctx.template
      |> ProjectTemplate.changeset(%{
        milestones_ordering_state: [Paths.project_template_milestone_id(ctx.launch)],
        tasks_kanban_state: %{
          not_started.value => [Paths.project_template_task_id(ctx.root_open_task)],
          done.value => [Paths.project_template_task_id(ctx.root_task)]
        }
      })
      |> Repo.update!()

    milestone =
      ctx.launch
      |> Operately.ProjectTemplates.Milestone.changeset(%{
        tasks_ordering_state: [
          Paths.project_template_task_id(ctx.milestone_task),
          Paths.project_template_task_id(ctx.milestone_open_task)
        ],
        tasks_kanban_state: %{
          not_started.value => [Paths.project_template_task_id(ctx.milestone_open_task)],
          done.value => [Paths.project_template_task_id(ctx.milestone_task)]
        }
      })
      |> Repo.update!()

    ctx |> Map.put(:template, template) |> Map.put(:launch, milestone)
  end
end
