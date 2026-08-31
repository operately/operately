defmodule Operately.Demo.ProjectTemplates do
  import Ecto.Query, only: [from: 2]

  alias Operately.Access.Binding
  alias Operately.Demo.{Resources, RichText}
  alias Operately.ProjectTemplates.{Discussion, Milestone, Person, ProjectTemplate, ResourceDocument, ResourceLink, ResourceNode, Task, TaskAssignment}
  alias Operately.Repo
  alias OperatelyWeb.Paths

  def create_project_templates(resources, data) when data in [nil, []], do: resources

  def create_project_templates(resources, data) do
    Resources.create(resources, data, fn {resources, data, _index} ->
      create_project_template(resources, data)
    end)
  end

  def create_project_template(resources, data) do
    template = insert_template!(resources, data)
    add_people(resources, template, data)
    create_milestones(resources, template, data[:milestones] || [])
    create_discussions(resources, template, data[:discussions] || [])
    create_documents(resources, template, data[:documents] || [])
    create_links(resources, template, data[:links] || [])
    persist_graph_state!(template)
  end

  defp insert_template!(resources, data) do
    company = Resources.get(resources, :company)
    owner = Resources.get(resources, :owner)
    space = Resources.get(resources, data.space)

    %{
      company_id: company.id,
      space_id: space.id,
      creator_id: owner.id,
      name: data.name,
      description: RichText.from_string(data[:description] || ""),
      duration_days: data[:duration_days]
    }
    |> ProjectTemplate.changeset()
    |> Repo.insert!()
  end

  defp add_people(resources, template, data) do
    add_role_holder(resources, template, data[:champion], :champion, "Champion")
    add_role_holder(resources, template, data[:reviewer], :reviewer, "Reviewer")

    Enum.each(data[:contributors] || [], fn contributor ->
      add_role_holder(resources, template, contributor.person, :contributor, contributor[:responsibility] || "Contributor")
    end)
  end

  defp add_role_holder(_resources, _template, nil, _role, _responsibility), do: :ok

  defp add_role_holder(resources, template, person_key, role, responsibility) do
    person = Resources.get(resources, person_key)
    find_or_create_person(template, person, role, responsibility)
  end

  defp find_or_create_person(template, person, role, responsibility) do
    case Repo.get_by(Person, project_template_id: template.id, person_id: person.id) do
      nil ->
        %{
          project_template_id: template.id,
          person_id: person.id,
          role: role,
          responsibility: responsibility,
          access_level: access_level(role)
        }
        |> Person.changeset()
        |> Repo.insert!()

      template_person ->
        template_person
    end
  end

  defp access_level(role) when role in [:champion, :reviewer], do: Binding.full_access()
  defp access_level(_role), do: Binding.edit_access()

  defp create_milestones(resources, template, milestones) do
    status = pending_status(template)

    Enum.each(milestones, fn milestone_data ->
      milestone = insert_milestone!(template, milestone_data)
      create_tasks(resources, template, milestone, status, milestone_data[:tasks] || [])
    end)
  end

  defp insert_milestone!(template, data) do
    %{
      project_template_id: template.id,
      title: data.title,
      description: RichText.from_string(data[:description] || ""),
      due_offset_days: data[:due_offset_days]
    }
    |> Milestone.changeset()
    |> Repo.insert!()
  end

  defp create_tasks(resources, template, milestone, status, tasks) do
    Enum.each(tasks, fn task_data ->
      task = insert_task!(template, milestone, status, task_data)
      assign_task(resources, template, task, task_data[:assignee])
    end)
  end

  defp insert_task!(template, milestone, status, data) do
    %{
      project_template_id: template.id,
      project_template_milestone_id: milestone.id,
      name: data.name,
      description: RichText.from_string(data[:description] || ""),
      priority: data[:priority],
      size: data[:size],
      due_offset_days: data[:due_offset_days],
      task_status: status_attrs(status)
    }
    |> Task.changeset()
    |> Repo.insert!()
  end

  defp assign_task(_resources, _template, _task, nil), do: :ok

  defp assign_task(resources, template, task, assignee_key) do
    person = Resources.get(resources, assignee_key)
    template_person = find_or_create_person(template, person, :contributor, "Contributor")

    %{
      project_template_id: template.id,
      project_template_task_id: task.id,
      project_template_person_id: template_person.id
    }
    |> TaskAssignment.changeset()
    |> Repo.insert!()
  end

  defp create_discussions(resources, template, discussions) do
    discussions
    |> Enum.with_index()
    |> Enum.each(fn {discussion, position} ->
      author = Resources.get(resources, discussion[:author] || :owner)

      %{
        project_template_id: template.id,
        author_id: author.id,
        title: discussion.title,
        body: Resources.rich_text!(resources, discussion.body),
        position: position
      }
      |> Discussion.changeset()
      |> Repo.insert!()
    end)
  end

  defp create_documents(resources, template, documents) do
    documents
    |> Enum.with_index()
    |> Enum.each(fn {document, position} ->
      author = Resources.get(resources, document[:author] || :owner)
      node = insert_resource_node!(template, :document, position)

      %{
        node_id: node.id,
        author_id: author.id,
        name: document.name,
        content: Resources.rich_text!(resources, document.content)
      }
      |> ResourceDocument.changeset()
      |> Repo.insert!()
    end)
  end

  defp create_links(resources, template, links) do
    start_position = length(Repo.all(from n in ResourceNode, where: n.project_template_id == ^template.id and is_nil(n.parent_folder_id)))

    links
    |> Enum.with_index(start_position)
    |> Enum.each(fn {link, position} ->
      author = Resources.get(resources, link[:author] || :owner)
      node = insert_resource_node!(template, :link, position)

      %{
        node_id: node.id,
        author_id: author.id,
        name: link.name,
        url: link.url,
        description: RichText.from_string(link[:content] || ""),
        type: link.type
      }
      |> ResourceLink.changeset()
      |> Repo.insert!()
    end)
  end

  defp insert_resource_node!(template, type, position) do
    %{project_template_id: template.id, type: type, position: position}
    |> ResourceNode.changeset()
    |> Repo.insert!()
  end

  defp persist_graph_state!(template) do
    template = Repo.reload!(template)
    milestones = Repo.all(from m in Milestone, where: m.project_template_id == ^template.id, order_by: [asc: m.inserted_at, asc: m.id])
    tasks = Repo.all(from t in Task, where: t.project_template_id == ^template.id, order_by: [asc: t.inserted_at, asc: t.id])

    template
    |> ProjectTemplate.changeset(%{
      milestones_ordering_state: Enum.map(milestones, &Paths.project_template_milestone_id/1),
      tasks_kanban_state: kanban_state(tasks, template.task_statuses)
    })
    |> Repo.update!()

    Enum.each(milestones, fn milestone ->
      milestone_tasks = Enum.filter(tasks, &(&1.project_template_milestone_id == milestone.id))

      milestone
      |> Milestone.changeset(%{
        tasks_ordering_state: Enum.map(milestone_tasks, &Paths.project_template_task_id/1),
        tasks_kanban_state: kanban_state(milestone_tasks, template.task_statuses)
      })
      |> Repo.update!()
    end)

    template
  end

  defp kanban_state(tasks, statuses) do
    empty = Map.new(statuses, fn status -> {status_key(status), []} end)

    Enum.reduce(tasks, empty, fn task, acc ->
      Map.update!(acc, status_key(task.task_status), &(&1 ++ [Paths.project_template_task_id(task)]))
    end)
  end

  defp status_key(status), do: status.value || status.id

  defp pending_status(template) do
    Enum.find(template.task_statuses, &(&1.value == "pending")) || List.first(template.task_statuses)
  end

  defp status_attrs(status) do
    %{
      id: status.id,
      label: status.label,
      color: status.color,
      index: status.index,
      value: status.value,
      closed: status.closed
    }
  end
end
