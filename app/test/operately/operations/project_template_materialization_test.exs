defmodule Operately.Operations.ProjectTemplateMaterializationTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias Operately.Comments.CommentThread
  alias Operately.Comments.MilestoneComment
  alias Operately.ContextualDates.Timeframe
  alias Operately.Blobs.Blob
  alias Operately.Notifications.{Subscription, SubscriptionList}
  alias Operately.Operations.{ProjectCreation, ProjectTemplateMaterialization}
  alias Operately.ProjectTemplates.{Comment, Person, ProjectTemplate, ResourceDocument, ResourceFile, TaskAssignment}
  alias Operately.Projects.{Contributor, Milestone, Project}
  alias Operately.Repo
  alias Operately.ResourceHubs.{DocumentVersion, ResourceHub}
  alias Operately.Support.Factory
  alias Operately.Tasks.{Reminder, Status, Task}
  alias Operately.Updates.Comment, as: RuntimeComment
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
      |> Factory.add_blob(:embedded_blob)
      |> Factory.add_blob(:file_blob)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_resource_folder(:parent_folder, :template, name: "Launch assets")
      |> Factory.add_project_template_resource_folder(:nested_folder, :template, parent_folder: :parent_folder, name: "Campaign")

    ctx =
      ctx
      |> Factory.add_project_template_resource_document(:document, :template,
        parent_folder: :nested_folder,
        position: 0,
        name: "Launch plan",
        content: blob_document(ctx.embedded_blob)
      )
      |> Factory.add_project_template_resource_file(:file, :template, :file_blob, parent_folder: :nested_folder, position: 1, name: "Launch file")
      |> Factory.add_project_template_resource_link(:link, :template, parent_folder: :nested_folder, position: 2, name: "Launch link")

    blob_count = Repo.aggregate(Blob, :count)
    assert {:ok, project} = materialize(ctx, ~D[2028-01-01])

    hub = Repo.preload(project, :resource_hub).resource_hub

    nodes =
      Repo.all(from node in Operately.ResourceHubs.Node, where: node.resource_hub_id == ^hub.id)
      |> Repo.preload([:folder, :document, :file, :link])

    parent_node = Enum.find(nodes, &(&1.folder && &1.folder.name == "Launch assets"))
    nested_node = Enum.find(nodes, &(&1.folder && &1.folder.name == "Campaign"))
    document_node = Enum.find(nodes, &(&1.document && &1.document.name == "Launch plan"))
    file_node = Enum.find(nodes, &(&1.file && &1.file.name == "Launch file"))
    document = document_node.document
    [version] = Repo.all(from version in DocumentVersion, where: version.document_id == ^document.id)

    assert parent_node.parent_folder_id == nil
    assert nested_node.parent_folder_id == parent_node.folder.id
    assert document_node.parent_folder_id == nested_node.folder.id
    assert file_node.parent_folder_id == nested_node.folder.id
    assert document_node.id != ctx.document.node.id
    assert nested_node.id != ctx.nested_folder.node.id
    assert document.content == ctx.document.content
    assert document.state == :published
    assert document.current_version == 1
    assert Operately.RichContent.find_blob_ids(document.content) == [ctx.embedded_blob.id]
    assert version.version_number == 1
    assert version.title == "Launch plan"
    assert version.content == ctx.document.content
    assert Repo.get_by!(SubscriptionList, parent_id: document.id, parent_type: :resource_hub_document)
    assert file_node.file.blob_id == ctx.file_blob.id
    assert Repo.aggregate(Blob, :count) == blob_count

    ctx.document
    |> ResourceDocument.changeset(%{name: "Changed template", content: %{"type" => "doc", "content" => []}})
    |> Repo.update!()

    ctx.file
    |> ResourceFile.changeset(%{name: "Changed template file"})
    |> Repo.update!()

    persisted_document = Repo.reload!(document)
    persisted_file = Repo.reload!(file_node.file)

    assert persisted_document.name == "Launch plan"
    assert persisted_document.content == blob_document(ctx.embedded_blob)
    assert persisted_file.name == "Launch file"
    assert persisted_file.blob_id == ctx.file_blob.id
  end

  test "materializes template comments onto generated parents without activities", ctx do
    ctx =
      ctx
      |> Factory.add_blob(:file_blob)
      |> Factory.add_company_member(:unavailable)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_milestone(:milestone, :template)
      |> Factory.add_project_template_task(:task, :template, milestone: :milestone)
      |> Factory.add_project_template_discussion(:discussion, :template, title: "Launch notes")
      |> Factory.add_project_template_resource_document(:document, :template, name: "Guide", position: 0)
      |> Factory.add_project_template_resource_file(:file, :template, :file_blob, name: "Artwork", position: 1)
      |> Factory.add_project_template_resource_link(:link, :template, name: "Dashboard", position: 2)

    ctx =
      ctx
      |> Factory.add_project_template_comment(:discussion_comment, :template, :discussion, content: %{"type" => "doc", "content" => [%{"type" => "paragraph"}]}, position: 0)
      |> Factory.add_project_template_comment(:milestone_comment, :template, :milestone, content: %{"type" => "doc", "content" => []})
      |> Factory.add_project_template_comment(:task_comment, :template, :task, content: %{"type" => "doc", "content" => []})
      |> Factory.add_project_template_comment(:document_comment, :template, :document, content: %{"type" => "doc", "content" => []})
      |> Factory.add_project_template_comment(:file_comment, :template, :file, content: %{"type" => "doc", "content" => []})
      |> Factory.add_project_template_comment(:link_comment, :template, :link, content: %{"type" => "doc", "content" => []})
      |> Factory.add_project_template_comment(:unavailable_author_comment, :template, :discussion,
        author: :unavailable,
        content: %{"type" => "doc", "content" => [%{"type" => "text"}]},
        position: 1
      )
      |> Factory.suspend_company_member(:unavailable)

    assert {:ok, project} = materialize(ctx, ~D[2028-01-01])

    discussion = Repo.get_by!(CommentThread, parent_id: project.id, parent_type: :project)
    milestone = Repo.get_by!(Milestone, project_id: project.id)
    task = Repo.get_by!(Task, project_id: project.id)
    hub = Repo.preload(project, :resource_hub).resource_hub
    document = Repo.one!(from node in Operately.ResourceHubs.Node, where: node.resource_hub_id == ^hub.id and node.type == :document, preload: [:document]).document
    file = Repo.one!(from node in Operately.ResourceHubs.Node, where: node.resource_hub_id == ^hub.id and node.type == :file, preload: [:file]).file
    link = Repo.one!(from node in Operately.ResourceHubs.Node, where: node.resource_hub_id == ^hub.id and node.type == :link, preload: [:link]).link

    comments = Repo.all(from c in RuntimeComment, where: c.entity_id in ^[discussion.id, milestone.id, task.id, document.id, file.id, link.id], order_by: [asc: c.inserted_at, asc: c.id])
    template_ids = MapSet.new([ctx.discussion_comment.id, ctx.milestone_comment.id, ctx.task_comment.id, ctx.document_comment.id, ctx.file_comment.id, ctx.link_comment.id, ctx.unavailable_author_comment.id])

    assert Enum.count(comments) == 7
    assert MapSet.disjoint?(MapSet.new(comments, & &1.id), template_ids)
    assert Repo.get_by!(MilestoneComment, milestone_id: milestone.id, action: :none).comment_id in Enum.map(comments, & &1.id)
    assert Enum.any?(comments, &(&1.entity_type == :comment_thread and &1.entity_id == discussion.id and &1.author_id == ctx.creator.id and &1.content == ctx.unavailable_author_comment.content))
    assert Repo.aggregate(from(a in Activity, where: a.content["project_id"] == ^project.id and a.action != "project_created"), :count) == 0

    ctx.discussion_comment |> Comment.changeset(%{content: %{"type" => "doc", "content" => []}}) |> Repo.update!()
    copied_discussion_comment = Enum.find(comments, &(&1.entity_id == discussion.id and &1.author_id == ctx.creator.id and &1.content == %{"type" => "doc", "content" => [%{"type" => "paragraph"}]}))
    assert Repo.reload!(copied_discussion_comment).content == %{"type" => "doc", "content" => [%{"type" => "paragraph"}]}
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
