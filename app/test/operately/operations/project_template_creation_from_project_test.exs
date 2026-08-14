defmodule Operately.Operations.ProjectTemplateCreationFromProjectTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Blobs.Blob
  alias Operately.Comments.CommentThread
  alias Operately.ContextualDates.ContextualDate
  alias Operately.Operations.ProjectTemplateCreationFromProject
  alias Operately.ProjectTemplates.{Discussion, Milestone, Person, ProjectTemplate, ResourceDocument, ResourceFile, ResourceFolder, ResourceLink, ResourceNode, Task, TaskAssignment}
  alias Operately.Projects.Project
  alias Operately.Repo
  alias Operately.ResourceHubs.{Document, File}
  alias Operately.Support.Factory
  alias Operately.Tasks.Status
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:source, :space, name: "Source project")
  end

  test "creates an independent core template graph with relative dates and reset task state", ctx do
    [queued, done] = statuses()
    start_date = ~D[2028-02-15]

    source =
      ctx.source
      |> Project.changeset(%{
        description: %{"type" => "doc", "content" => []},
        timeframe: timeframe(start_date, ~D[2028-03-16]),
        task_statuses: status_attrs([queued, done]),
        health: :off_track,
        status: "closed",
        closed_at: ~U[2028-03-20 12:00:00Z],
        success_status: :achieved
      })
      |> Repo.update!()

    ctx =
      ctx
      |> Map.put(:source, source)
      |> Factory.add_project_milestone(:launch, :source,
        title: "Launch",
        timeframe: timeframe(nil, ~D[2028-02-29])
      )
      |> Factory.add_project_task(:root_task, nil,
        project_id: source.id,
        name: "Prepare brief",
        description: %{"type" => "doc", "content" => []},
        priority: "high",
        size: "medium",
        due_date: ContextualDate.create_day_date(start_date),
        reminders: [
          %{type: :before_due, days: 2},
          %{type: :on_date, date: ~D[2028-02-14]}
        ],
        task_status: Map.from_struct(done),
        closed_at: ~N[2028-02-16 12:00:00]
      )
      |> Factory.add_project_task(:milestone_task, :launch,
        name: "Publish",
        due_date: ContextualDate.create_day_date(~D[2028-03-02]),
        task_status: Map.from_struct(queued)
      )
      |> put_source_states(queued, done)

    runtime_counts = runtime_counts()

    assert {:ok, template} = create_template(ctx, name: "Reusable launch", description: %{"type" => "doc", "content" => [%{"type" => "paragraph"}]})

    template = Repo.preload(template, [:milestones, :tasks])
    [milestone] = template.milestones
    root_task = Enum.find(template.tasks, &(&1.name == "Prepare brief"))
    milestone_task = Enum.find(template.tasks, &(&1.name == "Publish"))
    first_open = Enum.min_by(Enum.reject(template.task_statuses, & &1.closed), & &1.index)

    assert template.name == "Reusable launch"
    assert template.description == %{"type" => "doc", "content" => [%{"type" => "paragraph"}]}
    assert template.company_id == source.company_id
    assert template.space_id == source.group_id
    assert template.creator_id == ctx.creator.id
    assert template.source_project_id == source.id
    assert template.duration_days == 30
    assert MapSet.disjoint?(MapSet.new(template.task_statuses, & &1.id), MapSet.new(source.task_statuses, & &1.id))

    assert milestone.id != ctx.launch.id
    assert milestone.title == "Launch"
    assert milestone.due_offset_days == 14
    assert root_task.id != ctx.root_task.id
    assert root_task.project_template_milestone_id == nil
    assert root_task.priority == "high"
    assert root_task.size == "medium"
    assert root_task.due_offset_days == 0
    assert [%{type: :before_due, days: 2}] = root_task.reminders
    assert milestone_task.project_template_milestone_id == milestone.id
    assert milestone_task.due_offset_days == 16
    assert Enum.all?(template.tasks, &(&1.task_status.id == first_open.id))

    assert template.milestones_ordering_state == [Paths.project_template_milestone_id(milestone)]
    assert template.tasks_kanban_state[first_open.value] == [Paths.project_template_task_id(root_task)]
    assert milestone.tasks_ordering_state == [Paths.project_template_task_id(milestone_task)]
    assert milestone.tasks_kanban_state[first_open.value] == [Paths.project_template_task_id(milestone_task)]

    ctx.root_task |> Operately.Tasks.Task.changeset(%{name: "Changed source task"}) |> Repo.update!()
    persisted_template = template |> Repo.reload!() |> Repo.preload(:tasks)

    assert Enum.any?(persisted_template.tasks, &(&1.name == "Prepare brief"))
    assert runtime_counts() == runtime_counts
  end

  test "uses concrete contextual dates for zero, nil, and mixed-precision offsets", ctx do
    start_date = ~D[2028-02-01]

    source =
      ctx.source
      |> Project.changeset(%{
        timeframe: %{
          contextual_start_date: ContextualDate.create_month_date(start_date),
          contextual_end_date: ContextualDate.create_quarter_date(~D[2028-03-31])
        }
      })
      |> Repo.update!()

    task_status = source.task_statuses |> List.first() |> Map.from_struct()

    ctx =
      ctx
      |> Map.put(:source, source)
      |> Factory.add_project_milestone(:dated, :source, timeframe: timeframe(nil, start_date))
      |> Factory.add_project_milestone(:undated, :source, timeframe: timeframe(nil, nil))
      |> Factory.add_project_task(:dated_task, :dated,
        due_date: ContextualDate.create_year_date(start_date),
        task_status: task_status
      )
      |> Factory.add_project_task(:undated_task, :undated, due_date: nil, task_status: task_status)

    assert {:ok, template} = create_template(ctx)
    template = Repo.preload(template, [:milestones, :tasks])

    assert template.duration_days == 59
    assert Enum.find(template.milestones, &(&1.title == ctx.dated.title)).due_offset_days == 0
    assert Enum.find(template.milestones, &(&1.title == ctx.undated.title)).due_offset_days == nil
    assert Enum.find(template.tasks, &(&1.name == ctx.dated_task.name)).due_offset_days == 0
    assert Enum.find(template.tasks, &(&1.name == ctx.undated_task.name)).due_offset_days == nil
  end

  test "copies published Docs & Files into an independent template tree", ctx do
    ctx =
      ctx
      |> Factory.add_blob(:embedded_blob)
      |> Factory.fetch_default_project_resource_hub(:hub, :source)
      |> Factory.add_folder(:parent_folder, :hub)
      |> Factory.add_folder(:nested_folder, :hub, :parent_folder)

    ctx =
      ctx
      |> Factory.add_document(:published_document, :hub,
        folder: :nested_folder,
        name: "Published guide",
        content: blob_document(ctx.embedded_blob)
      )
      |> Factory.add_document(:draft_document, :hub, state: :draft, name: "Draft guide")
      |> Factory.add_document(:deleted_document, :hub, name: "Deleted guide")
      |> Factory.add_file(:file, :hub, folder: :nested_folder)
      |> Factory.add_file(:deleted_file, :hub)
      |> Factory.add_link(:link, :hub, folder: :nested_folder)
      |> Factory.add_link(:deleted_link, :hub)

    blob_count = Repo.aggregate(Blob, :count)

    {:ok, _} =
      Operately.ResourceHubs.create_document_version(%{
        document_id: ctx.published_document.id,
        version_number: 2,
        title: "Historical title",
        content: %{"type" => "doc", "content" => [%{"type" => "paragraph"}]},
        editor_id: ctx.creator.id,
        origin: :edited
      })

    ctx.deleted_document |> Ecto.Changeset.change(%{deleted_at: DateTime.utc_now()}) |> Repo.update!()
    ctx.deleted_file |> Ecto.Changeset.change(%{deleted_at: DateTime.utc_now()}) |> Repo.update!()
    ctx.deleted_link |> Ecto.Changeset.change(%{deleted_at: DateTime.utc_now()}) |> Repo.update!()

    assert {:ok, template} = create_template(ctx)

    nodes =
      Repo.all(from node in ResourceNode, where: node.project_template_id == ^template.id)
      |> Repo.preload([:folder, :document, :file, :link])

    parent_node = Enum.find(nodes, &(&1.folder && &1.folder.name == ctx.parent_folder.name))
    nested_node = Enum.find(nodes, &(&1.folder && &1.folder.name == ctx.nested_folder.name))
    document_node = Enum.find(nodes, &(&1.document && &1.document.name == "Published guide"))
    file_node = Enum.find(nodes, &(&1.file && &1.file.name == ctx.file.name))
    link_node = Enum.find(nodes, &(&1.link && &1.link.name == ctx.link.name))

    assert parent_node.parent_folder_id == nil
    assert nested_node.parent_folder_id == parent_node.folder.id
    assert document_node.parent_folder_id == nested_node.folder.id
    assert file_node.parent_folder_id == nested_node.folder.id
    assert link_node.parent_folder_id == nested_node.folder.id
    assert document_node.document.content == ctx.published_document.content
    assert Operately.RichContent.find_blob_ids(document_node.document.content) == [ctx.embedded_blob.id]
    refute document_node.document.content == %{"type" => "doc", "content" => [%{"type" => "paragraph"}]}
    refute Enum.any?(nodes, fn node -> node.document && node.document.name in ["Draft guide", "Deleted guide"] end)
    refute Enum.any?(nodes, &(&1.file && &1.file.id != file_node.file.id))
    refute Enum.any?(nodes, &(&1.link && &1.link.id != link_node.link.id))

    assert Enum.count(nodes, &(&1.type == :folder)) == 2
    assert Repo.aggregate(ResourceFolder, :count) == 2
    assert Repo.aggregate(ResourceDocument, :count) == 1
    assert Repo.aggregate(ResourceFile, :count) == 1
    assert Repo.aggregate(ResourceLink, :count) == 1
    assert Repo.aggregate(Blob, :count) == blob_count

    ctx.published_document
    |> Document.changeset(%{name: "Changed source", content: %{"type" => "doc", "content" => []}})
    |> Repo.update!()

    ctx.file
    |> File.changeset(%{name: "Changed source file"})
    |> Repo.update!()

    assert Repo.get!(ResourceDocument, document_node.document.id).name == "Published guide"
    assert Repo.get!(ResourceDocument, document_node.document.id).content == ctx.published_document.content
    assert Repo.get!(ResourceFile, file_node.file.id).name == ctx.file.name
  end

  test "supports an unscheduled project end and year-boundary offsets", ctx do
    source = ctx.source |> Project.changeset(%{timeframe: timeframe(~D[2028-12-31], nil)}) |> Repo.update!()

    assert {:ok, unscheduled} = create_template(%{ctx | source: source})
    assert unscheduled.duration_days == nil

    source = source |> Project.changeset(%{timeframe: timeframe(~D[2028-12-31], ~D[2029-01-01])}) |> Repo.update!()

    assert {:ok, scheduled} = create_template(%{ctx | source: source}, name: "Year boundary")
    assert scheduled.duration_days == 1
  end

  test "copies people and assignments only when selected", ctx do
    source = ctx.source |> Project.changeset(%{timeframe: timeframe(~D[2028-01-01], nil)}) |> Repo.update!()

    ctx =
      ctx
      |> Map.put(:source, source)
      |> Factory.add_company_member(:assignee)
      |> Factory.add_project_contributor(:champion_contributor, :source,
        role: :champion,
        permissions: :full_access,
        responsibility: "Leads delivery"
      )
      |> Factory.add_project_contributor(:guest_contributor, :source,
        permissions: :view_access,
        responsibility: "Advises",
        person_type: :guest
      )
      |> Factory.add_project_task(:task, nil,
        project_id: source.id,
        due_date: nil,
        task_status: source.task_statuses |> List.first() |> Map.from_struct()
      )
      |> Factory.add_task_assignee(:assignment, :task, :assignee)

    assert {:ok, excluded} = create_template(ctx)
    assert Repo.aggregate(from(p in Person, where: p.project_template_id == ^excluded.id), :count) == 0
    assert Repo.aggregate(from(a in TaskAssignment, where: a.project_template_id == ^excluded.id), :count) == 0

    assert {:ok, included} = create_template(ctx, name: "With people", include_people_and_assignments: true)
    included = Repo.preload(included, people: :person, task_assignments: [:project_template_person, :project_template_task])

    champion = Enum.find(included.people, &(&1.person_id == ctx.champion_contributor.person_id))
    guest = Enum.find(included.people, &(&1.person_id == ctx.guest_contributor.person_id))
    assignee = Enum.find(included.people, &(&1.person_id == ctx.assignee.id))

    assert champion.role == :champion
    assert champion.responsibility == "Leads delivery"
    assert champion.access_level == Operately.Access.Binding.full_access()
    assert guest.person.type == :guest
    assert guest.responsibility == "Advises"
    assert guest.access_level == Operately.Access.Binding.view_access()
    assert assignee.role == :contributor
    assert assignee.access_level == Operately.Access.Binding.edit_access()

    assert [assignment] = included.task_assignments
    assert assignment.project_template_person_id == assignee.id
    assert assignment.project_template_task.name == ctx.task.name
  end

  test "copies discussions in newest-first order unless they are excluded", ctx do
    ctx =
      ctx
      |> Factory.add_project_discussion(:older_discussion, :source, title: "Older discussion")
      |> Factory.add_project_discussion(:newer_discussion, :source, title: "Newer discussion")

    assert {:ok, template} = create_template(ctx)
    discussions = Repo.all(from d in Discussion, where: d.project_template_id == ^template.id, order_by: [asc: d.position])

    assert Enum.map(discussions, & &1.title) == ctx.source.id |> CommentThread.list_for_project() |> Enum.map(& &1.title)
    assert Enum.map(discussions, & &1.author_id) == [ctx.creator.id, ctx.creator.id]
    assert Enum.map(discussions, & &1.position) == [0, 1]

    assert {:ok, without_discussions} = create_template(ctx, name: "Without discussions", include_discussions: false)
    assert Repo.aggregate(from(d in Discussion, where: d.project_template_id == ^without_discussions.id), :count) == 0
  end

  test "returns every date before the project start in one structured error", ctx do
    start_date = ~D[2028-01-10]

    source =
      ctx.source
      |> Project.changeset(%{timeframe: timeframe(start_date, ~D[2028-01-09])})
      |> Repo.update!()

    task_status = source.task_statuses |> List.first() |> Map.from_struct()

    ctx =
      ctx
      |> Map.put(:source, source)
      |> Factory.add_project_milestone(:milestone, :source, title: "Early milestone", timeframe: timeframe(nil, ~D[2028-01-08]))
      |> Factory.add_project_task(:task, :milestone,
        name: "Early task",
        due_date: ContextualDate.create_day_date(~D[2028-01-07]),
        task_status: task_status
      )

    assert {:error, {:invalid_schedule, %{issues: issues}}} = create_template(ctx)

    assert issues == [
             %{resource_type: :project, resource_id: source.id, resource_name: source.name, field: :end_date, date: ~D[2028-01-09], reason: :before_project_start},
             %{resource_type: :milestone, resource_id: ctx.milestone.id, resource_name: "Early milestone", field: :due_date, date: ~D[2028-01-08], reason: :before_project_start}
           ]

    assert Repo.aggregate(ProjectTemplate, :count) == 0
  end

  test "clears task due dates and reminders that fall before the project start", ctx do
    start_date = ~D[2028-01-10]
    source = ctx.source |> Project.changeset(%{timeframe: timeframe(start_date, ~D[2028-01-20])}) |> Repo.update!()
    task_status = source.task_statuses |> List.first() |> Map.from_struct()

    ctx =
      ctx
      |> Map.put(:source, source)
      |> Factory.add_project_task(:early_task, nil,
        project_id: source.id,
        name: "Early task",
        due_date: ContextualDate.create_day_date(~D[2028-01-07]),
        reminders: [%{type: :before_due, days: 2}],
        task_status: task_status
      )
      |> Factory.add_project_task(:on_time_task, nil,
        project_id: source.id,
        name: "On-time task",
        due_date: ContextualDate.create_day_date(start_date),
        reminders: [%{type: :before_due, days: 1}],
        task_status: task_status
      )

    assert {:ok, template} = create_template(ctx)
    template = Repo.preload(template, :tasks)

    early_task = Enum.find(template.tasks, &(&1.name == "Early task"))
    on_time_task = Enum.find(template.tasks, &(&1.name == "On-time task"))

    assert early_task.due_offset_days == nil
    assert early_task.reminders == []
    assert on_time_task.due_offset_days == 0
    assert [%{type: :before_due, days: 1}] = on_time_task.reminders
  end

  test "returns a structured missing-start issue", ctx do
    source = ctx.source |> Project.changeset(%{timeframe: timeframe(nil, ~D[2028-01-10])}) |> Repo.update!()
    ctx = Map.put(ctx, :source, source)

    assert {:error, {:invalid_schedule, %{issues: issues}}} = create_template(ctx)

    assert issues == [
             %{
               resource_type: :project,
               resource_id: source.id,
               resource_name: source.name,
               field: :start_date,
               date: nil,
               reason: :missing
             }
           ]

    assert Repo.aggregate(ProjectTemplate, :count) == 0
  end

  test "rejects malformed source state and rolls back every template row", ctx do
    source =
      ctx.source
      |> Project.changeset(%{
        timeframe: timeframe(~D[2028-01-01], nil),
        milestones_ordering_state: ["foreign-milestone"]
      })
      |> Repo.update!()

    ctx = Map.put(ctx, :source, source)

    assert {:error, {:invalid_source, :foreign_ordering_id}} = create_template(ctx)
    assert Repo.aggregate(ProjectTemplate, :count) == 0
    assert Repo.aggregate(Milestone, :count) == 0
    assert Repo.aggregate(Task, :count) == 0
  end

  test "rejects workflows without an open status and mismatched Kanban columns", ctx do
    [queued, done] = statuses()

    all_closed =
      ctx.source
      |> Project.changeset(%{
        timeframe: timeframe(~D[2028-01-01], nil),
        task_statuses: status_attrs([%{queued | closed: true}, done])
      })
      |> Repo.update!()

    assert {:error, {:invalid_source, :no_open_task_status}} = create_template(%{ctx | source: all_closed})

    source = all_closed |> Project.changeset(%{task_statuses: status_attrs([queued, done])}) |> Repo.update!()

    ctx =
      ctx
      |> Map.put(:source, source)
      |> Factory.add_project_task(:task, nil,
        project_id: source.id,
        due_date: nil,
        task_status: Map.from_struct(done)
      )

    source = source |> Project.changeset(%{tasks_kanban_state: %{queued.value => [Paths.task_id(ctx.task)], done.value => []}}) |> Repo.update!()

    assert {:error, {:invalid_source, :mismatched_kanban_status}} = create_template(%{ctx | source: source})
    assert Repo.aggregate(ProjectTemplate, :count) == 0
  end

  test "rejects foreign milestone and task status references", ctx do
    source = ctx.source |> Project.changeset(%{timeframe: timeframe(~D[2028-01-01], nil)}) |> Repo.update!()
    valid_status = source.task_statuses |> List.first() |> Map.from_struct()

    ctx =
      ctx
      |> Map.put(:source, source)
      |> Factory.add_project(:other_project, :space)
      |> Factory.add_project_milestone(:other_milestone, :other_project)
      |> Factory.add_project_task(:task, nil, project_id: source.id, task_status: valid_status)

    task = ctx.task |> Operately.Tasks.Task.changeset(%{milestone_id: ctx.other_milestone.id}) |> Repo.update!()

    assert {:error, {:invalid_source, :foreign_milestone}} = create_template(ctx)

    task |> Operately.Tasks.Task.changeset(%{milestone_id: nil, task_status: Map.from_struct(Status.default_task_status())}) |> Repo.update!()

    assert {:error, {:invalid_source, :unknown_task_status}} = create_template(ctx)
    assert Repo.aggregate(ProjectTemplate, :count) == 0
  end

  test "rejects invalid source children and rolls back a root insert failure", ctx do
    source = ctx.source |> Project.changeset(%{timeframe: timeframe(~D[2028-01-01], nil)}) |> Repo.update!()
    task_status = source.task_statuses |> List.first() |> Map.from_struct()

    ctx =
      ctx
      |> Map.put(:source, source)
      |> Factory.add_project_task(:task, nil, project_id: source.id, due_date: nil, task_status: task_status)

    Repo.update_all(from(t in Operately.Tasks.Task, where: t.id == ^ctx.task.id), set: [name: nil])

    assert {:error, {:invalid_source_child, :task, changeset}} = create_template(ctx)
    refute changeset.valid?

    Repo.update_all(from(t in Operately.Tasks.Task, where: t.id == ^ctx.task.id), set: [name: "Valid again"])

    assert {:error, {:invalid_template, changeset}} = create_template(ctx, name: nil)
    refute changeset.valid?
    assert Repo.aggregate(ProjectTemplate, :count) == 0
    assert Repo.aggregate(Milestone, :count) == 0
    assert Repo.aggregate(Task, :count) == 0
  end

  test "rejects deleted projects and creators from another company", ctx do
    source = ctx.source |> Project.changeset(%{timeframe: timeframe(~D[2028-01-01], nil)}) |> Repo.update!()
    other_company = Operately.CompaniesFixtures.company_fixture()
    other_creator = Operately.PeopleFixtures.person_fixture_with_account(%{company_id: other_company.id})

    assert {:error, :creator_scope_mismatch} = create_template(%{ctx | source: source}, creator_id: other_creator.id)

    deleted = source |> Project.changeset(%{deleted_at: DateTime.utc_now()}) |> Repo.update!()

    assert {:error, :project_not_active} = create_template(%{ctx | source: deleted})
    assert Repo.aggregate(ProjectTemplate, :count) == 0
  end

  defp create_template(ctx, opts \\ []) do
    ProjectTemplateCreationFromProject.run(%ProjectTemplateCreationFromProject{
      project_id: ctx.source.id,
      creator_id: Keyword.get(opts, :creator_id, ctx.creator.id),
      name: Keyword.get(opts, :name, "Reusable project"),
      description: Keyword.get(opts, :description),
      include_people_and_assignments: Keyword.get(opts, :include_people_and_assignments, false),
      include_discussions: Keyword.get(opts, :include_discussions, true)
    })
  end

  defp put_source_states(ctx, queued, done) do
    source =
      ctx.source
      |> Project.changeset(%{
        milestones_ordering_state: [Paths.milestone_id(ctx.launch)],
        tasks_kanban_state: %{
          queued.value => [],
          done.value => [Paths.task_id(ctx.root_task)]
        }
      })
      |> Repo.update!()

    launch =
      ctx.launch
      |> Operately.Projects.Milestone.changeset(%{
        status: :done,
        completed_at: ~N[2028-03-03 12:00:00],
        tasks_ordering_state: [Paths.task_id(ctx.milestone_task)],
        tasks_kanban_state: %{
          queued.value => [Paths.task_id(ctx.milestone_task)],
          done.value => []
        }
      })
      |> Repo.update!()

    ctx |> Map.put(:source, source) |> Map.put(:launch, launch)
  end

  defp runtime_counts do
    %{
      projects: Repo.aggregate(Project, :count),
      milestones: Repo.aggregate(Operately.Projects.Milestone, :count),
      tasks: Repo.aggregate(Operately.Tasks.Task, :count),
      activities: Repo.aggregate(Operately.Activities.Activity, :count),
      subscriptions: Repo.aggregate(Operately.Notifications.Subscription, :count),
      subscription_lists: Repo.aggregate(Operately.Notifications.SubscriptionList, :count),
      access_contexts: Repo.aggregate(Operately.Access.Context, :count),
      resource_hubs: Repo.aggregate(Operately.ResourceHubs.ResourceHub, :count),
      contributors: Repo.aggregate(Operately.Projects.Contributor, :count),
      goals: Repo.aggregate(Operately.Goals.Goal, :count),
      notifications: Repo.aggregate(Operately.Notifications.Notification, :count),
      check_ins: Repo.aggregate(Operately.Projects.CheckIn, :count),
      retrospectives: Repo.aggregate(Operately.Projects.Retrospective, :count)
    }
  end

  defp timeframe(start_date, end_date) do
    %{
      contextual_start_date: start_date && ContextualDate.create_day_date(start_date),
      contextual_end_date: end_date && ContextualDate.create_day_date(end_date)
    }
  end

  defp statuses do
    [
      %Status{id: Ecto.UUID.generate(), label: "Queued", color: :gray, value: "queued", index: 0, closed: false},
      %Status{id: Ecto.UUID.generate(), label: "Done", color: :green, value: "done", index: 1, closed: true}
    ]
  end

  defp status_attrs(statuses), do: Enum.map(statuses, &Map.from_struct/1)

  defp blob_document(blob) do
    %{
      "type" => "doc",
      "content" => [
        %{
          "type" => "blob",
          "attrs" => %{
            "id" => Paths.blob_id(blob),
            "src" => Blob.url(blob),
            "title" => blob.filename,
            "filetype" => blob.content_type
          }
        }
      ]
    }
  end
end
