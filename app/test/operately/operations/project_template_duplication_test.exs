defmodule Operately.Operations.ProjectTemplateDuplicationTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Activities.Activity
  alias Operately.Blobs.Blob
  alias Operately.Notifications.{Notification, Subscription, SubscriptionList}
  alias Operately.Operations.ProjectTemplateDuplication
  alias Operately.ProjectTemplates.{Comment, Milestone, ProjectTemplate, Task}
  alias Operately.Repo
  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_company_member(:contributor)
    |> Factory.add_blob(:file_blob)
  end

  test "duplicates the complete template graph with fresh IDs and remapped references", ctx do
    ctx =
      ctx
      |> Factory.add_project_template(:template, :space,
        name: "Launch kit",
        description: %{"type" => "doc", "content" => []},
        duration_days: 30
      )

    [not_started, in_progress | _] = ctx.template.task_statuses

    ctx =
      ctx
      |> Factory.add_project_template_milestone(:milestone, :template,
        title: "Launch",
        due_offset_days: 14
      )
      |> Factory.add_project_template_task(:root_task, :template,
        name: "Prepare brief",
        due_offset_days: 3,
        reminders: [%{type: :before_due, days: 2}],
        task_status: Map.from_struct(in_progress)
      )
      |> Factory.add_project_template_task(:milestone_task, :template,
        name: "Publish",
        milestone: :milestone,
        due_offset_days: 10,
        task_status: Map.from_struct(not_started)
      )
      |> Factory.add_project_template_person(:template_person, :template, :contributor,
        responsibility: "Writes the brief",
        access_level: Operately.Access.Binding.edit_access()
      )
      |> Factory.add_project_template_task_assignment(:assignment, :template, :root_task, :template_person)
      |> Factory.add_project_template_discussion(:discussion, :template,
        title: "Launch notes",
        body: %{"type" => "doc", "content" => []}
      )
      |> Factory.add_project_template_resource_folder(:folder, :template, name: "Assets")
      |> Factory.add_project_template_resource_folder(:nested_folder, :template, parent_folder: :folder, name: "Drafts")
      |> Factory.add_project_template_resource_document(:document, :template,
        parent_folder: :nested_folder,
        position: 0,
        name: "Launch plan"
      )
      |> Factory.add_project_template_resource_file(:file, :template, :file_blob,
        parent_folder: :folder,
        position: 1,
        name: "Artwork"
      )
      |> Factory.add_project_template_resource_link(:link, :template,
        parent_folder: :folder,
        position: 2,
        name: "Dashboard"
      )
      |> Factory.add_project_template_comment(:discussion_comment, :template, :discussion, content: %{"type" => "doc", "content" => [%{"type" => "paragraph"}]})
      |> Factory.add_project_template_comment(:document_comment, :template, :document, content: %{"type" => "doc", "content" => []})
      |> Factory.add_project_template_comment(:file_comment, :template, :file, content: %{"type" => "doc", "content" => []})
      |> Factory.add_project_template_comment(:link_comment, :template, :link, content: %{"type" => "doc", "content" => []})
      |> Factory.suspend_company_member(:contributor)
      |> put_ordering_and_kanban(in_progress, not_started)

    counts_before = side_effect_counts()

    assert {:ok, duplicate} =
             ProjectTemplateDuplication.run(%ProjectTemplateDuplication{
               template_id: ctx.template.id,
               creator_id: ctx.creator.id,
               name: "Launch kit copy"
             })

    duplicate = load_graph(duplicate)

    assert duplicate.name == "Launch kit copy"
    assert duplicate.space_id == ctx.template.space_id
    assert duplicate.creator_id == ctx.creator.id
    assert duplicate.source_project_id == nil
    assert duplicate.archived_at == nil
    assert duplicate.description == ctx.template.description
    assert duplicate.duration_days == 30

    [copied_milestone] = duplicate.milestones
    copied_root_task = Enum.find(duplicate.tasks, &(&1.name == "Prepare brief"))
    copied_milestone_task = Enum.find(duplicate.tasks, &(&1.name == "Publish"))
    [copied_person] = duplicate.people
    [copied_assignment] = duplicate.task_assignments
    [copied_discussion] = duplicate.discussions

    refute copied_milestone.id == ctx.milestone.id
    refute copied_root_task.id == ctx.root_task.id
    refute copied_person.id == ctx.template_person.id
    refute copied_assignment.id == ctx.assignment.id
    refute copied_discussion.id == ctx.discussion.id
    assert copied_milestone.due_offset_days == 14
    assert copied_root_task.due_offset_days == 3
    assert copied_root_task.reminders == ctx.root_task.reminders
    assert copied_milestone_task.project_template_milestone_id == copied_milestone.id
    assert copied_person.person_id == ctx.contributor.id
    assert Repo.reload!(ctx.contributor).suspended_at
    assert copied_person.responsibility == "Writes the brief"
    assert copied_assignment.project_template_task_id == copied_root_task.id
    assert copied_assignment.project_template_person_id == copied_person.id
    assert copied_discussion.author_id == ctx.discussion.author_id

    source_status_ids = MapSet.new(ctx.template.task_statuses, & &1.id)
    copied_status_ids = MapSet.new(duplicate.task_statuses, & &1.id)
    assert MapSet.disjoint?(source_status_ids, copied_status_ids)
    assert copied_root_task.task_status.value == in_progress.value
    assert copied_milestone_task.task_status.value == not_started.value
    assert duplicate.milestones_ordering_state == [Paths.project_template_milestone_id(copied_milestone)]
    assert duplicate.tasks_kanban_state[in_progress.value] == [Paths.project_template_task_id(copied_root_task)]
    assert duplicate.tasks_kanban_state[not_started.value] == [Paths.project_template_task_id(copied_milestone_task)]
    assert copied_milestone.tasks_ordering_state == [Paths.project_template_task_id(copied_milestone_task)]
    assert copied_milestone.tasks_kanban_state[not_started.value] == [Paths.project_template_task_id(copied_milestone_task)]

    assert_resource_graph_copied(ctx, duplicate)
    assert_comments_copied(ctx, duplicate, copied_discussion)
    assert side_effect_counts() == counts_before
  end

  test "the duplicate and source remain independent", ctx do
    ctx =
      ctx
      |> Factory.add_project_template(:template, :space, name: "Source")
      |> Factory.add_project_template_task(:task, :template, name: "Original task")

    assert {:ok, duplicate} = duplicate(ctx)
    copied_task = Repo.get_by!(Task, project_template_id: duplicate.id)

    ctx.task |> Task.changeset(%{name: "Changed source"}) |> Repo.update!()
    copied_task |> Task.changeset(%{name: "Changed copy"}) |> Repo.update!()

    assert Repo.reload!(ctx.task).name == "Changed source"
    assert Repo.reload!(copied_task).name == "Changed copy"
  end

  test "rejects archived templates and rolls back malformed graphs", ctx do
    ctx = ctx |> Factory.add_project_template(:template, :space) |> Factory.add_project_template_task(:task, :template)
    archived = ctx.template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update!()

    assert {:error, :template_not_active} = duplicate(%{ctx | template: archived})

    active = archived |> ProjectTemplate.changeset(%{archived_at: nil, milestones_ordering_state: ["foreign-milestone"]}) |> Repo.update!()
    count_before = Repo.aggregate(ProjectTemplate, :count)

    assert {:error, {:invalid_template, :foreign_ordering_id}} = duplicate(%{ctx | template: active})
    assert Repo.aggregate(ProjectTemplate, :count) == count_before
  end

  defp duplicate(ctx) do
    ProjectTemplateDuplication.run(%ProjectTemplateDuplication{
      template_id: ctx.template.id,
      creator_id: ctx.creator.id,
      name: "Copy"
    })
  end

  defp put_ordering_and_kanban(ctx, root_status, milestone_status) do
    template =
      ctx.template
      |> ProjectTemplate.changeset(%{
        milestones_ordering_state: [Paths.project_template_milestone_id(ctx.milestone)],
        tasks_kanban_state: %{
          root_status.value => [Paths.project_template_task_id(ctx.root_task)],
          milestone_status.value => [Paths.project_template_task_id(ctx.milestone_task)]
        }
      })
      |> Repo.update!()

    milestone =
      ctx.milestone
      |> Milestone.changeset(%{
        tasks_ordering_state: [Paths.project_template_task_id(ctx.milestone_task)],
        tasks_kanban_state: %{}
      })
      |> Repo.update!()

    %{ctx | template: template, milestone: milestone}
  end

  defp load_graph(template) do
    Repo.preload(template,
      milestones: from(m in Milestone, order_by: [asc: m.inserted_at]),
      tasks: from(t in Task, order_by: [asc: t.inserted_at]),
      people: [],
      task_assignments: [],
      discussions: [],
      comments: [],
      resource_nodes: [folder: [], document: [], file: [], link: []]
    )
  end

  defp assert_resource_graph_copied(ctx, duplicate) do
    folder_node = Enum.find(duplicate.resource_nodes, &(&1.folder && &1.folder.name == "Assets"))
    nested_folder_node = Enum.find(duplicate.resource_nodes, &(&1.folder && &1.folder.name == "Drafts"))
    document_node = Enum.find(duplicate.resource_nodes, & &1.document)
    file_node = Enum.find(duplicate.resource_nodes, & &1.file)
    link_node = Enum.find(duplicate.resource_nodes, & &1.link)

    refute folder_node.id == ctx.folder.node.id
    refute nested_folder_node.id == ctx.nested_folder.node.id
    refute document_node.document.id == ctx.document.id
    refute file_node.file.id == ctx.file.id
    refute link_node.link.id == ctx.link.id
    assert nested_folder_node.parent_folder_id == folder_node.folder.id
    assert document_node.parent_folder_id == nested_folder_node.folder.id
    assert file_node.parent_folder_id == folder_node.folder.id
    assert link_node.parent_folder_id == folder_node.folder.id
    assert file_node.file.blob_id == ctx.file_blob.id
    assert Repo.aggregate(Blob, :count) == 1
  end

  defp assert_comments_copied(ctx, duplicate, copied_discussion) do
    copied_document = Enum.find(duplicate.resource_nodes, & &1.document).document
    copied_file = Enum.find(duplicate.resource_nodes, & &1.file).file
    copied_link = Enum.find(duplicate.resource_nodes, & &1.link).link
    comments = Repo.all(from(c in Comment, where: c.project_template_id == ^duplicate.id))
    source_comment_ids = MapSet.new([ctx.discussion_comment.id, ctx.document_comment.id, ctx.file_comment.id, ctx.link_comment.id])

    assert Enum.count(comments) == 4
    assert MapSet.disjoint?(source_comment_ids, MapSet.new(comments, & &1.id))
    assert Enum.any?(comments, &(&1.parent_type == :discussion and &1.parent_id == copied_discussion.id and &1.content == ctx.discussion_comment.content))
    assert Enum.any?(comments, &(&1.parent_type == :document and &1.parent_id == copied_document.id and &1.content == ctx.document_comment.content))
    assert Enum.any?(comments, &(&1.parent_type == :file and &1.parent_id == copied_file.id and &1.content == ctx.file_comment.content))
    assert Enum.any?(comments, &(&1.parent_type == :link and &1.parent_id == copied_link.id and &1.content == ctx.link_comment.content))
    assert Enum.all?(comments, &(&1.author_id == ctx.creator.id))
    refute Enum.any?(comments, &(&1.parent_id in [ctx.discussion.id, ctx.document.id, ctx.file.id, ctx.link.id]))
  end

  defp side_effect_counts do
    %{
      activities: Repo.aggregate(Activity, :count),
      notifications: Repo.aggregate(Notification, :count),
      subscriptions: Repo.aggregate(Subscription, :count),
      subscription_lists: Repo.aggregate(SubscriptionList, :count),
      projects: Repo.aggregate(Operately.Projects.Project, :count)
    }
  end
end
