defmodule Operately.Support.Factory.ProjectTemplates do
  alias Operately.ProjectTemplates.{Discussion, Milestone, Person, ProjectTemplate, ResourceDocument, ResourceFile, ResourceFolder, ResourceLink, ResourceNode, Task, TaskAssignment}
  alias Operately.Repo
  alias Operately.Support.Factory.Utils

  def add_project_template(ctx, testid, space_name, opts \\ []) do
    source_project = Keyword.get(opts, :source_project)

    attrs =
      %{
        company_id: ctx.company.id,
        space_id: ctx[space_name].id,
        creator_id: ctx[Keyword.get(opts, :creator, :creator)].id,
        source_project_id: source_project && ctx[source_project].id,
        name: Keyword.get(opts, :name, Utils.testid_to_name(testid)),
        description: Keyword.get(opts, :description, %{}),
        duration_days: Keyword.get(opts, :duration_days),
        task_statuses: Keyword.get(opts, :task_statuses),
        milestones_ordering_state: Keyword.get(opts, :milestones_ordering_state),
        tasks_kanban_state: Keyword.get(opts, :tasks_kanban_state)
      }
      |> Enum.reject(fn {_key, value} -> is_nil(value) end)
      |> Map.new()

    template = attrs |> ProjectTemplate.changeset() |> Repo.insert!()
    Map.put(ctx, testid, template)
  end

  def add_project_template_milestone(ctx, testid, template_name, opts \\ []) do
    attrs =
      %{
        project_template_id: ctx[template_name].id,
        title: Keyword.get(opts, :title, Utils.testid_to_name(testid)),
        description: Keyword.get(opts, :description, %{}),
        due_offset_days: Keyword.get(opts, :due_offset_days),
        tasks_ordering_state: Keyword.get(opts, :tasks_ordering_state),
        tasks_kanban_state: Keyword.get(opts, :tasks_kanban_state)
      }
      |> Enum.reject(fn {_key, value} -> is_nil(value) end)
      |> Map.new()

    milestone = attrs |> Milestone.changeset() |> Repo.insert!()
    Map.put(ctx, testid, milestone)
  end

  def add_project_template_task(ctx, testid, template_name, opts \\ []) do
    milestone = Keyword.get(opts, :milestone)
    task_status = task_status(ctx, template_name, opts)

    attrs =
      %{
        project_template_id: ctx[template_name].id,
        project_template_milestone_id: milestone && ctx[milestone].id,
        name: Keyword.get(opts, :name, Utils.testid_to_name(testid)),
        description: Keyword.get(opts, :description, %{}),
        priority: Keyword.get(opts, :priority),
        size: Keyword.get(opts, :size),
        due_offset_days: Keyword.get(opts, :due_offset_days)
      }
      |> maybe_put(:reminders, Keyword.get(opts, :reminders))
      |> maybe_put(:task_status, task_status)

    task = attrs |> Task.changeset() |> Repo.insert!()
    Map.put(ctx, testid, task)
  end

  def add_project_template_resource_folder(ctx, testid, template_name, opts \\ []) do
    node =
      ResourceNode.changeset(%{project_template_id: ctx[template_name].id, parent_folder_id: parent_folder_id(ctx, opts), type: :folder, position: Keyword.get(opts, :position, 0)}) |> Repo.insert!()

    folder = ResourceFolder.changeset(%{node_id: node.id, name: Keyword.get(opts, :name, Utils.testid_to_name(testid))}) |> Repo.insert!()
    Map.put(ctx, testid, %{folder | node: node})
  end

  def add_project_template_resource_document(ctx, testid, template_name, opts \\ []) do
    node =
      ResourceNode.changeset(%{project_template_id: ctx[template_name].id, parent_folder_id: parent_folder_id(ctx, opts), type: :document, position: Keyword.get(opts, :position, 0)}) |> Repo.insert!()

    document =
      ResourceDocument.changeset(%{
        node_id: node.id,
        author_id: ctx[Keyword.get(opts, :author, :creator)].id,
        name: Keyword.get(opts, :name, Utils.testid_to_name(testid)),
        content: Keyword.get(opts, :content, %{})
      })
      |> Repo.insert!()

    Map.put(ctx, testid, %{document | node: node})
  end

  def add_project_template_resource_file(ctx, testid, template_name, blob_name, opts \\ []) do
    node =
      ResourceNode.changeset(%{project_template_id: ctx[template_name].id, parent_folder_id: parent_folder_id(ctx, opts), type: :file, position: Keyword.get(opts, :position, 0)}) |> Repo.insert!()

    file =
      ResourceFile.changeset(%{
        node_id: node.id,
        author_id: ctx[Keyword.get(opts, :author, :creator)].id,
        blob_id: ctx[blob_name].id,
        preview_blob_id: preview_blob_id(ctx, opts),
        name: Keyword.get(opts, :name, Utils.testid_to_name(testid)),
        description: Keyword.get(opts, :description, %{})
      })
      |> Repo.insert!()

    Map.put(ctx, testid, %{file | node: node})
  end

  def add_project_template_resource_link(ctx, testid, template_name, opts \\ []) do
    node =
      ResourceNode.changeset(%{project_template_id: ctx[template_name].id, parent_folder_id: parent_folder_id(ctx, opts), type: :link, position: Keyword.get(opts, :position, 0)}) |> Repo.insert!()

    link =
      ResourceLink.changeset(%{
        node_id: node.id,
        author_id: ctx[Keyword.get(opts, :author, :creator)].id,
        name: Keyword.get(opts, :name, Utils.testid_to_name(testid)),
        url: Keyword.get(opts, :url, "https://operately.com"),
        description: Keyword.get(opts, :description, %{}),
        type: Keyword.get(opts, :type, :other)
      })
      |> Repo.insert!()

    Map.put(ctx, testid, %{link | node: node})
  end

  defp parent_folder_id(ctx, opts), do: Keyword.get(opts, :parent_folder) && ctx[Keyword.fetch!(opts, :parent_folder)].id
  defp preview_blob_id(ctx, opts), do: Keyword.get(opts, :preview_blob) && ctx[Keyword.fetch!(opts, :preview_blob)].id

  def add_project_template_person(ctx, testid, template_name, person_name, opts \\ []) do
    attrs = %{
      project_template_id: ctx[template_name].id,
      person_id: ctx[person_name].id,
      role: Keyword.get(opts, :role, :contributor),
      responsibility: Keyword.get(opts, :responsibility),
      access_level: Keyword.get(opts, :access_level, Operately.Access.Binding.view_access())
    }

    person = attrs |> Person.changeset() |> Repo.insert!()
    Map.put(ctx, testid, person)
  end

  def add_project_template_task_assignment(ctx, testid, template_name, task_name, person_name) do
    assignment =
      %{
        project_template_id: ctx[template_name].id,
        project_template_task_id: ctx[task_name].id,
        project_template_person_id: ctx[person_name].id
      }
      |> TaskAssignment.changeset()
      |> Repo.insert!()

    Map.put(ctx, testid, assignment)
  end

  def add_project_template_discussion(ctx, testid, template_name, opts \\ []) do
    template = Map.fetch!(ctx, template_name)
    author = Keyword.get(opts, :author, ctx.creator)

    discussion =
      %{
        project_template_id: template.id,
        author_id: author && author.id,
        title: Keyword.get(opts, :title, Utils.testid_to_name(testid)),
        body: Keyword.get(opts, :body, %{}),
        position: Keyword.get(opts, :position, 0)
      }
      |> Discussion.changeset()
      |> Repo.insert!()

    Map.put(ctx, testid, discussion)
  end

  defp maybe_put(attrs, _key, nil), do: attrs
  defp maybe_put(attrs, key, value), do: Map.put(attrs, key, value)

  defp task_status(ctx, template_name, opts) do
    Keyword.get(opts, :task_status) || Map.from_struct(List.first(ctx[template_name].task_statuses))
  end
end
