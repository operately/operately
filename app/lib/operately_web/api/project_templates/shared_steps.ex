defmodule OperatelyWeb.Api.ProjectTemplates.SharedSteps do
  require Logger
  import Ecto.Query, only: [from: 2]

  alias Operately.Access.Binding
  alias Operately.Groups.Group
  alias Operately.Operations.{
    ProjectCreation,
    ProjectTemplateCreationFromProject,
    ProjectTemplateDuplication,
    ProjectTemplateMaterialization,
    ProjectTemplateMilestoneOrderingUpdating
  }
  alias Operately.ProjectTemplates
  alias Operately.People.Person, as: CompanyPerson

  alias Operately.ProjectTemplates.{
    Comment,
    Discussion,
    Milestone,
    Permissions,
    Person,
    ProjectTemplate,
    ResourceDocument,
    ResourceFile,
    ResourceFolder,
    ResourceLink,
    ResourceNode,
    Task,
    TaskAssignment
  }

  alias Operately.Projects.Project
  alias Operately.Repo
  alias OperatelyWeb.Api.Helpers, as: ApiHelpers
  alias OperatelyWeb.Api.ProjectTemplates.Helpers, as: TemplateHelpers
  alias OperatelyWeb.Paths

  @template_state_fields [:milestones_ordering_state]
  @milestone_state_fields [:tasks_ordering_state]

  def start_transaction(conn) do
    Ecto.Multi.new()
    |> Ecto.Multi.put(:conn, conn)
    |> Ecto.Multi.put(:me, ApiHelpers.me(conn))
    |> Ecto.Multi.put(:company_read_only, ApiHelpers.company_read_only(conn))
  end

  def ensure_feature_enabled(multi) do
    Ecto.Multi.run(multi, :feature_enabled, fn _repo, %{conn: conn} ->
      ProjectTemplates.ensure_feature_enabled(ApiHelpers.company(conn))
    end)
  end

  def load_space(multi, space_id) do
    Ecto.Multi.run(multi, :space, fn _repo, %{me: requester} ->
      Group.get(requester, id: space_id, company_id: requester.company_id)
    end)
  end

  def load_template(multi, template_id) do
    Ecto.Multi.run(multi, :template, fn _repo, %{me: requester} ->
      with {:ok, template} <- ProjectTemplate.get(requester, id: template_id, company_id: requester.company_id),
           :ok <- ensure_active(template) do
        {:ok, template}
      end
    end)
  end

  @doc """
  Loads a visible template without requiring it to be active, so archived
  templates remain readable.
  """
  def load_template_for_view(multi, template_id) do
    Ecto.Multi.run(multi, :template, fn _repo, %{me: requester} ->
      ProjectTemplate.get(requester, id: template_id, company_id: requester.company_id)
    end)
  end

  def load_project(multi, project_id) do
    Ecto.Multi.run(multi, :project, fn _repo, %{me: requester} ->
      Project.get(requester, id: project_id, company_id: requester.company_id)
    end)
  end

  def load_project_space(multi) do
    Ecto.Multi.run(multi, :space, fn _repo, %{me: requester, project: project} ->
      Group.get(requester, id: project.group_id, company_id: requester.company_id)
    end)
  end

  def check_space_permissions(multi, permission) do
    Ecto.Multi.run(multi, :permissions, fn _repo, %{space: space, company_read_only: company_read_only} ->
      Permissions.check(space.request_info.access_level, permission, company_read_only: company_read_only)
    end)
  end

  def check_template_permissions(multi, permission) do
    Ecto.Multi.run(multi, :permissions, fn _repo, %{template: template, company_read_only: company_read_only} ->
      Permissions.check(template.request_info.access_level, permission, company_read_only: company_read_only)
    end)
  end

  def ensure_template_belongs_to_space(multi) do
    Ecto.Multi.run(multi, :template_space, fn _repo, %{space: space, template: template} ->
      if template.space_id == space.id, do: {:ok, :same_space}, else: {:error, :template_scope_mismatch}
    end)
  end

  def create_project_from_template(multi, inputs) do
    Ecto.Multi.run(multi, :project, fn _repo, %{me: creator, space: space, template: template} ->
      ProjectTemplateMaterialization.run(%ProjectTemplateMaterialization{
        template_id: template.id,
        start_date: inputs.start_date,
        project: project_creation_attrs(creator, space, inputs)
      })
    end)
  end

  def duplicate_template(multi, name) do
    Ecto.Multi.run(multi, :duplicated_template, fn _repo, %{template: template, me: creator} ->
      ProjectTemplateDuplication.run(%ProjectTemplateDuplication{
        template_id: template.id,
        creator_id: creator.id,
        name: name
      })
    end)
  end

  def ensure_template_archived(multi) do
    Ecto.Multi.run(multi, :template_state, fn _repo, %{template: template} ->
      if template.archived_at, do: {:ok, :archived}, else: {:error, :template_not_archived}
    end)
  end

  def archive_template(multi) do
    run_step(multi, :archived_template, fn %{template: template} ->
      template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> persist!()
    end)
  end

  def restore_template(multi) do
    run_step(multi, :restored_template, fn %{template: template} ->
      template |> ProjectTemplate.changeset(%{archived_at: nil}) |> persist!()
    end)
  end

  def delete_template(multi) do
    run_step(multi, :deleted_template, fn %{template: template} ->
      delete!(template)
    end)
  end

  def create_template_from_project({:ok, changes}, inputs) do
    case ProjectTemplateCreationFromProject.run(%ProjectTemplateCreationFromProject{
           project_id: changes.project.id,
           creator_id: changes.me.id,
           name: inputs.name,
           description: inputs[:description],
           include_people_and_assignments: inputs[:include_people_and_assignments] || false,
           include_discussions: inputs[:include_discussions] != false,
           include_docs_and_files: inputs[:include_docs_and_files] != false,
           include_comments: inputs[:include_comments] == true
         }) do
      {:ok, template} -> {:ok, Map.put(changes, :template_creation, %{template: template, schedule_issues: []})}
      {:error, {:invalid_schedule, %{issues: issues}}} -> {:ok, Map.put(changes, :template_creation, %{template: nil, schedule_issues: issues})}
      {:error, reason} -> {:error, :template_creation, reason, changes}
    end
  end

  def create_template_from_project(error, _inputs), do: error

  def load_milestone(multi, milestone_id) do
    Ecto.Multi.run(multi, :milestone, fn repo, %{template: template} ->
      case repo.get_by(Milestone, id: milestone_id, project_template_id: template.id) do
        nil -> {:error, :not_found}
        milestone -> {:ok, milestone}
      end
    end)
  end

  def load_task(multi, task_id) do
    Ecto.Multi.run(multi, :task, fn repo, %{template: template} ->
      case repo.get_by(Task, id: task_id, project_template_id: template.id) do
        nil -> {:error, :not_found}
        task -> {:ok, task}
      end
    end)
  end

  def load_discussion(multi, discussion_id) do
    Ecto.Multi.run(multi, :discussion, fn repo, %{template: template} ->
      case repo.get_by(Discussion, id: discussion_id, project_template_id: template.id) do
        nil -> {:error, :not_found}
        discussion -> {:ok, repo.preload(discussion, :author)}
      end
    end)
  end

  def load_comment_parent(multi, parent_type, parent_id) do
    Ecto.Multi.run(multi, :comment_parent, fn repo, %{template: template} ->
      find_comment_parent(repo, template.id, parent_type, parent_id)
    end)
  end

  def load_comment(multi, comment_id) do
    Ecto.Multi.run(multi, :comment, fn repo, %{template: template} ->
      case repo.get_by(Comment, id: comment_id, project_template_id: template.id) do
        nil -> {:error, :not_found}
        comment -> {:ok, repo.preload(comment, :author)}
      end
    end)
  end

  def list_comments(multi, parent_type, parent_id) do
    Ecto.Multi.run(multi, :comments, fn repo, %{template: template} ->
      comments =
        from(c in Comment,
          where: c.project_template_id == ^template.id and c.parent_type == ^parent_type and c.parent_id == ^parent_id,
          order_by: [asc: c.position, asc: c.id],
          preload: [:author]
        )
        |> repo.all()

      {:ok, comments}
    end)
  end

  def create_comment(multi, attrs) do
    run_step(multi, :comment, fn %{template: template, me: author, comment_parent: parent} ->
      parent_type = attrs.parent_type
      parent_id = parent.id

      %{
        project_template_id: template.id,
        author_id: author.id,
        parent_type: parent_type,
        parent_id: parent_id,
        content: attrs.content,
        position: next_comment_position(template.id, parent_type, parent_id)
      }
      |> Comment.changeset()
      |> persist!()
      |> Repo.preload(:author)
    end)
  end

  def update_comment(multi, attrs) do
    run_step(multi, :updated_comment, fn %{comment: comment} ->
      comment
      |> Comment.changeset(attrs)
      |> persist!()
      |> Repo.preload(:author)
    end)
  end

  def delete_comment(multi) do
    run_step(multi, :deleted_comment, fn %{comment: comment} ->
      case Repo.delete(comment) do
        {:ok, deleted} -> deleted
        {:error, changeset} -> fail!(changeset)
      end
    end)
  end

  def load_template_person(multi, template_person_id) do
    Ecto.Multi.run(multi, :template_person, fn repo, %{template: template} ->
      case repo.get_by(Person, id: template_person_id, project_template_id: template.id) do
        nil -> {:error, :not_found}
        template_person -> {:ok, template_person}
      end
    end)
  end

  def create_template(multi, inputs) do
    Ecto.Multi.insert(multi, :template, fn %{me: creator} ->
      inputs
      |> Map.put(:company_id, creator.company_id)
      |> Map.put(:creator_id, creator.id)
      |> ProjectTemplate.changeset()
    end)
  end

  def update_template(multi, attrs) do
    run_step(multi, :updated_template, fn %{template: template} ->
      replacements = Map.get(attrs, :deleted_status_replacements, [])
      previous_status_ids = Enum.map(template.task_statuses, & &1.id)
      state_attrs = Map.take(attrs, @template_state_fields)
      update_attrs = Map.drop(attrs, [:deleted_status_replacements | @template_state_fields])

      require_ok!(TemplateHelpers.validate_workflow(attrs))
      updated_template = persist!(ProjectTemplate.changeset(template, update_attrs))

      if Map.has_key?(attrs, :task_statuses) do
        replace_task_statuses!(updated_template, previous_status_ids, replacements)
      end

      updated_template
      |> Repo.reload!()
      |> update_template_states!(state_attrs)
    end)
  end

  def create_milestone(multi, attrs) do
    run_step(multi, :milestone, fn %{template: template} ->
      milestone =
        attrs
        |> Map.put(:project_template_id, template.id)
        |> Milestone.changeset()
        |> persist!()

      template = Repo.reload!(template)
      ordering = TemplateHelpers.normalize_ordering(template.milestones_ordering_state, milestone_ids(template.id))
      persist!(ProjectTemplate.changeset(template, %{milestones_ordering_state: ordering}))

      milestone
    end)
  end

  def update_milestone(multi, attrs) do
    run_step(multi, :updated_milestone, fn %{template: template, milestone: milestone} ->
      state_attrs = Map.take(attrs, @milestone_state_fields)

      milestone
      |> Milestone.changeset(Map.drop(attrs, @milestone_state_fields))
      |> persist!()
      |> update_milestone_states!(template, state_attrs)
    end)
  end

  def delete_milestone(multi) do
    run_step(multi, :deleted_milestone, fn %{template: template, milestone: milestone} ->
      deleted = delete!(milestone)
      template = Repo.reload!(template)
      ordering = TemplateHelpers.normalize_ordering(template.milestones_ordering_state, milestone_ids(template.id))
      persist!(ProjectTemplate.changeset(template, %{milestones_ordering_state: ordering}))
      deleted
    end)
  end

  def create_task(multi, attrs) do
    run_step(multi, :task, fn %{template: template} ->
      milestone_id = Map.get(attrs, :project_template_milestone_id)
      validate_milestone!(template, milestone_id)
      status = require_ok!(TemplateHelpers.canonical_status(template, Map.get(attrs, :task_status)))

      task =
        attrs
        |> Map.put(:project_template_id, template.id)
        |> Map.put(:task_status, TemplateHelpers.status_attrs(status))
        |> Task.changeset()
        |> persist!()

      rebuild_container!(template, milestone_id)
      task
    end)
  end

  def update_task(multi, attrs) do
    run_step(multi, :updated_task, fn %{template: template, task: task} ->
      old_milestone_id = task.project_template_milestone_id
      new_milestone_id = if Map.has_key?(attrs, :project_template_milestone_id), do: attrs.project_template_milestone_id, else: old_milestone_id
      validate_milestone!(template, new_milestone_id)

      attrs =
        if Map.has_key?(attrs, :task_status) do
          status = require_ok!(TemplateHelpers.canonical_status(template, attrs.task_status))
          Map.put(attrs, :task_status, TemplateHelpers.status_attrs(status))
        else
          attrs
        end

      updated_task = task |> Task.changeset(attrs) |> persist!()

      update_task_containers!(template, old_milestone_id, new_milestone_id)

      updated_task
    end)
  end

  def update_task_milestone_and_ordering(multi, milestone_id, index) do
    Ecto.Multi.merge(multi, fn %{template: template, task: task} ->
      ProjectTemplateMilestoneOrderingUpdating.run(template, task, milestone_id, index)
    end)
  end

  def delete_task(multi) do
    run_step(multi, :deleted_task, fn %{template: template, task: task} ->
      deleted = delete!(task)
      rebuild_container!(template, task.project_template_milestone_id)
      deleted
    end)
  end

  def create_person(multi, attrs) do
    run_step(multi, :template_person, fn %{template: template} ->
      company_person = active_company_person!(template, attrs.person_id)
      ensure_person_is_not_represented!(template, company_person.id)
      demote_current_role_holder!(template, attrs.role)

      attrs
      |> Map.put(:project_template_id, template.id)
      |> normalize_role_access()
      |> Person.changeset()
      |> persist!()
      |> preload_template_person()
    end)
  end

  def update_person(multi, attrs) do
    run_step(multi, :updated_template_person, fn %{template: template, template_person: template_person} ->
      role = Map.get(attrs, :role, template_person.role)
      {template_person, attrs} = prepare_person_update!(template, template_person, attrs, role)
      demote_current_role_holder!(template, role, template_person.id)

      template_person
      |> Person.changeset(normalize_role_access(attrs, role))
      |> persist!()
      |> preload_template_person()
    end)
  end

  def delete_person(multi) do
    run_step(multi, :deleted_template_person, fn %{template_person: template_person} ->
      delete!(template_person)
    end)
  end

  def update_task_assignees(multi, person_ids) do
    run_step(multi, :task_assignments, fn %{template: template, task: task} ->
      person_ids = Enum.uniq(person_ids)
      company_people = Enum.map(person_ids, &active_company_person!(template, &1))
      template_people = Enum.map(company_people, &find_or_create_contributor!(template, &1))
      desired_ids = MapSet.new(template_people, & &1.id)

      Repo.all(from a in TaskAssignment, where: a.project_template_id == ^template.id and a.project_template_task_id == ^task.id)
      |> Enum.each(fn assignment ->
        unless MapSet.member?(desired_ids, assignment.project_template_person_id), do: delete!(assignment)
      end)

      existing_ids =
        Repo.all(from a in TaskAssignment, where: a.project_template_id == ^template.id and a.project_template_task_id == ^task.id, select: a.project_template_person_id)
        |> MapSet.new()

      template_people
      |> Enum.reject(&MapSet.member?(existing_ids, &1.id))
      |> Enum.each(fn template_person ->
        %{project_template_id: template.id, project_template_task_id: task.id, project_template_person_id: template_person.id}
        |> TaskAssignment.changeset()
        |> persist!()
      end)

      Repo.all(from a in TaskAssignment, where: a.project_template_id == ^template.id and a.project_template_task_id == ^task.id)
    end)
  end

  def create_discussion(multi, attrs) do
    run_step(multi, :discussion, fn %{template: template, me: author} ->
      Repo.update_all(from(d in Discussion, where: d.project_template_id == ^template.id), inc: [position: 1])

      attrs
      |> Map.merge(%{project_template_id: template.id, author_id: author.id, position: 0})
      |> Discussion.changeset()
      |> persist!()
      |> Repo.preload(:author)
    end)
  end

  def update_discussion(multi, attrs) do
    run_step(multi, :updated_discussion, fn %{discussion: discussion} ->
      discussion
      |> Discussion.changeset(attrs)
      |> persist!()
      |> Repo.preload(:author)
    end)
  end

  def load_resource_node(multi, node_id) do
    Ecto.Multi.run(multi, :resource_node, fn repo, %{template: template} ->
      case repo.get_by(ResourceNode, id: node_id, project_template_id: template.id) do
        nil -> {:error, :not_found}
        node -> {:ok, node}
      end
    end)
  end

  def load_resource(multi, name, schema, id) do
    Ecto.Multi.run(multi, name, fn repo, %{template: template} ->
      query = from resource in schema, join: node in assoc(resource, :node), where: resource.id == ^id and node.project_template_id == ^template.id, preload: [node: []]

      case repo.one(query) do
        nil -> {:error, :not_found}
        resource -> {:ok, resource}
      end
    end)
  end

  def create_resource(multi, type, attrs) do
    run_step(multi, :resource, fn %{template: template, me: author} ->
      parent_folder_id = Map.get(attrs, :parent_folder_id)
      validate_resource_parent!(template, parent_folder_id)
      position = insert_position!(template.id, parent_folder_id)
      node = persist!(ResourceNode.changeset(%{project_template_id: template.id, parent_folder_id: parent_folder_id, type: type, position: position}))

      create_resource_content!(type, node.id, author.id, template.company_id, attrs)
      |> preload_resource()
    end)
  end

  def create_files(multi, parent_folder_id, files) do
    run_step(multi, :files, fn %{template: template, me: author} ->
      validate_resource_parent!(template, parent_folder_id)

      Enum.map(files, fn attrs ->
        position = insert_position!(template.id, parent_folder_id)
        node = persist!(ResourceNode.changeset(%{project_template_id: template.id, parent_folder_id: parent_folder_id, type: :file, position: position}))

        create_resource_content!(:file, node.id, author.id, template.company_id, attrs)
        |> preload_resource()
      end)
    end)
  end

  def update_resource(multi, name, schema, attrs) do
    run_step(multi, :updated_resource, fn changes ->
      resource = Map.fetch!(changes, name)

      schema
      |> apply(:changeset, [resource, attrs])
      |> persist!()
      |> preload_resource()
    end)
  end

  def delete_resource(multi) do
    run_step(multi, :deleted_resource, fn %{resource_node: node} -> delete!(node) end)
  end

  def move_resource(multi, attrs) do
    run_step(multi, :moved_resource, fn %{template: template, resource_node: node} ->
      parent_folder_id = Map.get(attrs, :parent_folder_id)
      validate_resource_parent!(template, parent_folder_id)
      ensure_not_descendant!(node, parent_folder_id)
      old_parent_id = node.parent_folder_id
      node = node |> ResourceNode.changeset(%{parent_folder_id: parent_folder_id, position: 0}) |> persist!()
      normalize_resource_positions!(template.id, old_parent_id)
      normalize_resource_positions!(template.id, parent_folder_id, node.id)
      node
    end)
  end

  def commit(multi), do: Repo.transaction(multi)

  def respond(result, success) do
    case result do
      {:ok, changes} -> {:ok, success.(changes)}
      error -> handle_error(error)
    end
  end

  defp update_template_states!(template, attrs) do
    template = Repo.reload!(template)
    milestones = Repo.all(from m in Milestone, where: m.project_template_id == ^template.id)

    changes = %{}
    changes = maybe_put_ordering(changes, attrs, :milestones_ordering_state, milestones, &Paths.project_template_milestone_id/1, "Milestone ordering contains IDs from another template")

    if changes == %{}, do: template, else: persist!(ProjectTemplate.changeset(template, changes))
  end

  defp update_milestone_states!(milestone, template, attrs) do
    tasks = tasks_for(template.id, milestone.id)

    changes = %{}
    changes = maybe_put_ordering(changes, attrs, :tasks_ordering_state, tasks, &Paths.project_template_task_id/1, "Task ordering contains IDs from another template container")

    if changes == %{}, do: milestone, else: persist!(Milestone.changeset(milestone, changes))
  end

  defp maybe_put_ordering(changes, attrs, key, resources, id_fun, error_message) do
    if Map.has_key?(attrs, key) do
      valid_ids = Enum.map(resources, id_fun)
      ordering = require_ok!(TemplateHelpers.validate_ordering(Map.fetch!(attrs, key), valid_ids, error_message))
      Map.put(changes, key, ordering)
    else
      changes
    end
  end

  defp replace_task_statuses!(template, previous_status_ids, replacements) do
    tasks = Repo.all(from t in Task, where: t.project_template_id == ^template.id)
    old_status_ids = MapSet.new(previous_status_ids)
    new_statuses_by_id = Map.new(template.task_statuses, &{&1.id, &1})
    new_status_ids = MapSet.new(Map.keys(new_statuses_by_id))
    deleted_status_ids = MapSet.difference(old_status_ids, new_status_ids)
    replacement_map = require_ok!(TemplateHelpers.validate_replacements(replacements, deleted_status_ids, new_status_ids))

    Enum.each(tasks, fn task ->
      status =
        case Map.fetch(new_statuses_by_id, task.task_status.id) do
          {:ok, status} -> status
          :error -> require_ok!(TemplateHelpers.replacement_status(task.task_status.id, replacement_map, new_statuses_by_id))
        end

      persist!(Task.changeset(task, %{task_status: TemplateHelpers.status_attrs(status)}))
    end)

    Repo.reload!(template)
  end

  defp rebuild_container!(_template, nil), do: :ok

  defp rebuild_container!(template, milestone_id) do
    milestone = Repo.get_by!(Milestone, id: milestone_id, project_template_id: template.id)
    tasks = tasks_for(template.id, milestone_id)
    ordering = TemplateHelpers.normalize_ordering(milestone.tasks_ordering_state, Enum.map(tasks, &Paths.project_template_task_id/1))
    persist!(Milestone.changeset(milestone, %{tasks_ordering_state: ordering}))
  end

  defp update_task_containers!(template, old_milestone_id, new_milestone_id) do
    [old_milestone_id, new_milestone_id]
    |> Enum.uniq()
    |> Enum.each(&rebuild_container!(template, &1))
  end

  defp validate_milestone!(_template, nil), do: :ok

  defp validate_milestone!(template, milestone_id) do
    if Repo.exists?(from m in Milestone, where: m.id == ^milestone_id and m.project_template_id == ^template.id) do
      :ok
    else
      fail!({:not_found, :milestone})
    end
  end

  defp milestone_ids(template_id) do
    Repo.all(from m in Milestone, where: m.project_template_id == ^template_id, order_by: [asc: m.inserted_at, asc: m.id])
    |> Enum.map(&Paths.project_template_milestone_id/1)
  end

  defp tasks_for(template_id, nil) do
    Repo.all(from t in Task, where: t.project_template_id == ^template_id and is_nil(t.project_template_milestone_id), order_by: [asc: t.inserted_at, asc: t.id])
  end

  defp tasks_for(template_id, milestone_id) do
    Repo.all(from t in Task, where: t.project_template_id == ^template_id and t.project_template_milestone_id == ^milestone_id, order_by: [asc: t.inserted_at, asc: t.id])
  end

  defp persist!(changeset) do
    case Repo.insert_or_update(changeset) do
      {:ok, resource} -> resource
      {:error, changeset} -> fail!(changeset)
    end
  end

  defp find_comment_parent(repo, template_id, :discussion, parent_id) do
    case repo.get_by(Discussion, id: parent_id, project_template_id: template_id) do
      nil -> {:error, :not_found}
      discussion -> {:ok, discussion}
    end
  end

  defp find_comment_parent(repo, template_id, parent_type, parent_id) when parent_type in [:document, :file, :link] do
    query =
      from resource in comment_parent_schema(parent_type),
        join: node in assoc(resource, :node),
        where: resource.id == ^parent_id and node.project_template_id == ^template_id

    case repo.one(query) do
      nil -> {:error, :not_found}
      resource -> {:ok, resource}
    end
  end

  defp find_comment_parent(_repo, _template_id, _parent_type, _parent_id), do: {:error, :not_found}

  defp comment_parent_schema(:document), do: ResourceDocument
  defp comment_parent_schema(:file), do: ResourceFile
  defp comment_parent_schema(:link), do: ResourceLink

  defp next_comment_position(template_id, parent_type, parent_id) do
    from(c in Comment,
      where: c.project_template_id == ^template_id and c.parent_type == ^parent_type and c.parent_id == ^parent_id,
      select: max(c.position)
    )
    |> Repo.one()
    |> case do
      nil -> 0
      position -> position + 1
    end
  end

  defp create_resource_content!(:folder, node_id, _author_id, _company_id, attrs), do: persist!(ResourceFolder.changeset(%{node_id: node_id, name: attrs.name}))

  defp create_resource_content!(:document, node_id, author_id, _company_id, attrs),
    do: persist!(ResourceDocument.changeset(%{node_id: node_id, author_id: author_id, name: attrs.name, content: attrs.content}))

  defp create_resource_content!(:file, node_id, author_id, company_id, attrs) do
    validate_blob!(attrs.blob_id, company_id)
    if attrs[:preview_blob_id], do: validate_blob!(attrs.preview_blob_id, company_id)
    persist!(ResourceFile.changeset(%{node_id: node_id, author_id: author_id, blob_id: attrs.blob_id, preview_blob_id: attrs[:preview_blob_id], name: attrs.name, description: attrs[:description]}))
  end

  defp create_resource_content!(:link, node_id, author_id, _company_id, attrs),
    do: persist!(ResourceLink.changeset(%{node_id: node_id, author_id: author_id, name: attrs.name, url: attrs.url, description: attrs[:description], type: attrs.type}))

  defp validate_resource_parent!(_template, nil), do: :ok

  defp validate_resource_parent!(template, parent_folder_id) do
    if Repo.exists?(from folder in ResourceFolder, join: node in assoc(folder, :node), where: folder.id == ^parent_folder_id and node.project_template_id == ^template.id) do
      :ok
    else
      fail!(:not_found)
    end
  end

  defp insert_position!(template_id, parent_folder_id) do
    nodes_in_resource_container(template_id, parent_folder_id)
    |> Repo.update_all(inc: [position: 1])

    0
  end

  defp normalize_resource_positions!(template_id, parent_folder_id, first_node_id \\ nil) do
    nodes = Repo.all(from node in nodes_in_resource_container(template_id, parent_folder_id), order_by: [asc: node.position, asc: node.id])
    nodes = if first_node_id, do: [Enum.find(nodes, &(&1.id == first_node_id)) | Enum.reject(nodes, &(&1.id == first_node_id))], else: nodes
    Enum.with_index(nodes) |> Enum.each(fn {node, position} -> persist!(ResourceNode.changeset(node, %{position: position})) end)
  end

  defp nodes_in_resource_container(template_id, nil) do
    from node in ResourceNode,
      where: node.project_template_id == ^template_id and is_nil(node.parent_folder_id)
  end

  defp nodes_in_resource_container(template_id, parent_folder_id) do
    from node in ResourceNode,
      where: node.project_template_id == ^template_id and node.parent_folder_id == ^parent_folder_id
  end

  defp ensure_not_descendant!(%{type: :folder, id: node_id}, parent_folder_id) when not is_nil(parent_folder_id) do
    folder = Repo.get_by!(ResourceFolder, node_id: node_id)
    if descendant_folder?(folder.id, parent_folder_id), do: fail!({:validation, "A folder cannot be moved into itself"})
  end

  defp ensure_not_descendant!(_node, _parent_folder_id), do: :ok

  defp descendant_folder?(folder_id, folder_id), do: true

  defp descendant_folder?(folder_id, candidate_folder_id) do
    case Repo.get(ResourceFolder, candidate_folder_id) |> Repo.preload(:node) do
      %{node: %{parent_folder_id: nil}} -> false
      %{node: %{parent_folder_id: parent_id}} -> descendant_folder?(folder_id, parent_id)
      _ -> false
    end
  end

  defp active_company_person!(template, person_id) do
    case Repo.get_by(CompanyPerson, id: person_id, company_id: template.company_id) do
      %{suspended: false, suspended_at: nil} = person -> person
      _ -> fail!(:not_found)
    end
  end

  defp validate_blob!(blob_id, company_id) do
    case Repo.get(Operately.Blobs.Blob, blob_id) do
      %{company_id: ^company_id, status: :uploaded} -> :ok
      _ -> fail!({:validation, "The uploaded file is unavailable"})
    end
  end

  defp preload_resource(%ResourceFolder{} = resource), do: Repo.preload(resource, :node)
  defp preload_resource(%ResourceDocument{} = resource), do: Repo.preload(resource, [:node, :author])
  defp preload_resource(%ResourceFile{} = resource), do: Repo.preload(resource, [:node, :author, :blob, :preview_blob])
  defp preload_resource(%ResourceLink{} = resource), do: Repo.preload(resource, [:node, :author])

  defp ensure_person_is_not_represented!(template, person_id, except_id \\ nil) do
    query = from p in Person, where: p.project_template_id == ^template.id and p.person_id == ^person_id
    query = if except_id, do: from(p in query, where: p.id != ^except_id), else: query
    if Repo.exists?(query), do: fail!({:validation, "Person is already part of this template"})
  end

  defp prepare_person_update!(template, template_person, attrs, role) do
    case Map.fetch(attrs, :person_id) do
      {:ok, person_id} ->
        active_company_person!(template, person_id)

        case Repo.get_by(Person, project_template_id: template.id, person_id: person_id) do
          nil ->
            {template_person, attrs}

          %{id: id} when id == template_person.id ->
            {template_person, attrs}

          existing when role in [:champion, :reviewer] ->
            template_person |> Person.changeset(%{role: :contributor}) |> persist!()
            {existing, Map.delete(attrs, :person_id)}

          _existing ->
            fail!({:validation, "Person is already part of this template"})
        end

      :error ->
        {template_person, attrs}
    end
  end

  defp demote_current_role_holder!(template, role, except_id \\ nil)
  defp demote_current_role_holder!(_template, :contributor, _except_id), do: :ok

  defp demote_current_role_holder!(template, role, except_id) when role in [:champion, :reviewer] do
    query = from p in Person, where: p.project_template_id == ^template.id and p.role == ^role
    query = if except_id, do: from(p in query, where: p.id != ^except_id), else: query

    Repo.all(query)
    |> Enum.each(fn person -> person |> Person.changeset(%{role: :contributor}) |> persist!() end)
  end

  defp normalize_role_access(attrs), do: normalize_role_access(attrs, attrs.role)
  defp normalize_role_access(attrs, role) when role in [:champion, :reviewer], do: Map.put(attrs, :access_level, Binding.full_access())
  defp normalize_role_access(attrs, _role), do: attrs

  defp find_or_create_contributor!(template, company_person) do
    case Repo.get_by(Person, project_template_id: template.id, person_id: company_person.id) do
      nil ->
        %{project_template_id: template.id, person_id: company_person.id, role: :contributor, access_level: Binding.edit_access()}
        |> Person.changeset()
        |> persist!()

      template_person ->
        template_person
    end
  end

  defp preload_template_person(template_person) do
    Repo.preload(template_person, [:person, :project_template], force: true)
  end

  defp project_creation_attrs(creator, space, inputs) do
    space = Group.preload_access_levels(space)
    company_access_level = if space.access_levels.company == Binding.no_access(), do: Binding.no_access(), else: inputs.company_access_level

    %ProjectCreation{
      name: inputs.name,
      champion_id: nil,
      reviewer_id: nil,
      creator_role: "Contributor",
      visibility: "everyone",
      creator_id: creator.id,
      company_id: creator.company_id,
      group_id: space.id,
      goal_id: inputs[:goal_id],
      anonymous_access_level: inputs.anonymous_access_level,
      company_access_level: company_access_level,
      space_access_level: inputs.space_access_level
    }
  end

  defp delete!(resource) do
    case Repo.delete(resource) do
      {:ok, resource} -> resource
      {:error, changeset} -> fail!(changeset)
    end
  end

  defp run_step(multi, name, callback) do
    Ecto.Multi.run(multi, name, fn _repo, changes ->
      try do
        {:ok, callback.(changes)}
      catch
        {:step_error, reason} -> {:error, reason}
      end
    end)
  end

  defp require_ok!(:ok), do: :ok
  defp require_ok!({:ok, value}), do: value
  defp require_ok!({:error, reason}), do: fail!(reason)
  defp fail!(reason), do: throw({:step_error, reason})

  defp ensure_active(%{archived_at: nil}), do: :ok
  defp ensure_active(_template), do: {:error, :forbidden}

  defp handle_error({:error, _step, :not_found, _changes}), do: {:error, :not_found}
  defp handle_error({:error, _step, {:not_found, _resource}, _changes}), do: {:error, :not_found}
  defp handle_error({:error, _step, :forbidden, _changes}), do: {:error, :forbidden}
  defp handle_error({:error, _step, :template_not_found, _changes}), do: {:error, :not_found}
  defp handle_error({:error, _step, :template_scope_mismatch, _changes}), do: {:error, :not_found}
  defp handle_error({:error, _step, :template_not_active, _changes}), do: {:error, :forbidden}
  defp handle_error({:error, _step, :template_not_archived, _changes}), do: {:error, :bad_request}
  defp handle_error({:error, _step, {:invalid_template, _reason}, _changes}), do: {:error, :bad_request}
  defp handle_error({:error, _step, {:invalid_child, _type, _changeset}, _changes}), do: {:error, :bad_request}
  defp handle_error({:error, _step, {:invalid_source, _reason}, _changes}), do: {:error, :bad_request}
  defp handle_error({:error, _step, {:invalid_source_child, _type, _changeset}, _changes}), do: {:error, :bad_request}
  defp handle_error({:error, _step, {:invalid_template_child, _type, _changeset}, _changes}), do: {:error, :bad_request}
  defp handle_error({:error, _step, {:invalid_resource_tree, _reason}, _changes}), do: {:error, :bad_request}
  defp handle_error({:error, _step, :invalid_resource_parent, _changes}), do: {:error, :bad_request}
  defp handle_error({:error, _step, {:validation, message}, _changes}), do: {:error, :bad_request, message}
  defp handle_error({:error, _step, %Ecto.Changeset{}, _changes}), do: {:error, :bad_request}

  defp handle_error(error) do
    Logger.error("Project template transaction failed: #{inspect(error)}")
    {:error, :internal_server_error}
  end
end
