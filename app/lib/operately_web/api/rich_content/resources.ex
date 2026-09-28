defmodule OperatelyWeb.Api.RichContent.Resources do
  @moduledoc "Explicit edit adapters for live rich-text fields."
  alias OperatelyWeb.Api
  alias Operately.Repo
  alias OperatelyWeb.Api.RichContent.TemplateResources

  @resources %{
    kpi: {Operately.Kpis.Kpi, :description, Operately.Groups.Permissions, :can_edit},
    project: {Operately.Projects.Project, :description, Operately.Projects.Permissions, :can_edit},
    goal: {Operately.Goals.Goal, :description, Operately.Goals.Permissions, :can_edit},
    task: {Operately.Tasks.Task, :description, Operately.Projects.Permissions, :can_edit},
    milestone: {Operately.Projects.Milestone, :description, Operately.Projects.Permissions, :can_edit},
    document: {Operately.ResourceHubs.Document, :content, Operately.ResourceHubs.Permissions, :can_edit_document},
    file: {Operately.ResourceHubs.File, :description, Operately.ResourceHubs.Permissions, :can_edit_file},
    link: {Operately.ResourceHubs.Link, :description, Operately.ResourceHubs.Permissions, :can_edit_link},
    space_discussion: {Operately.Messages.Message, :body, Operately.Groups.Permissions, :can_edit},
    project_discussion: {Operately.Comments.CommentThread, :message, Operately.Projects.Permissions, :can_edit},
    goal_discussion: {Operately.Comments.CommentThread, :message, Operately.Goals.Permissions, :can_edit},
    project_check_in: {Operately.Projects.CheckIn, :description, Operately.Projects.Permissions, :can_edit},
    goal_check_in: {Operately.Goals.Update, :message, Operately.Goals.Permissions, :can_edit},
    project_retrospective: {Operately.Projects.Retrospective, :content, Operately.Projects.Permissions, :can_edit}
  }

  def types, do: Map.keys(@resources) ++ [:comment, :person] ++ TemplateResources.types()
  def fields, do: [:description, :content, :message, :body]

  def load(conn, type, id, field) when is_map_key(@resources, type) do
    {schema, expected_field, permissions, permission} = Map.fetch!(@resources, type)
    me = Api.Helpers.me(conn)

    with true <- field == expected_field,
         {:ok, record} <- schema.get(me, id: id),
         {:ok, _} <- check_permission(conn, type, record, permissions, permission),
         {:ok, _} <- check_draft(type, record, me),
         {:ok, record} <- prepare(type, record) do
      {:ok, record}
    else
      false -> {:error, :bad_request}
      error -> error
    end
  end

  def load(conn, :comment, id, :content) do
    me = Api.Helpers.me(conn)

    with %{} = comment <- Repo.get(Operately.Updates.Comment, id),
         {:ok, comment} <- Operately.Updates.get_comment_with_access_level(id, me.id, comment_parent_type(comment)),
         true <- comment.author_id == me.id and not Api.Helpers.company_read_only(conn) do
      {:ok, comment}
    else
      nil -> {:error, :not_found}
      false -> {:error, :forbidden}
      error -> error
    end
  end

  def load(conn, :person, id, :description) do
    me = Api.Helpers.me(conn)

    with {:ok, person} <- Operately.People.get_person_with_access_level(id, me.id),
         true <- person.id == me.id,
         {:ok, _} <- Operately.People.Permissions.check(person.requester_access_level, :can_edit_profile, company_read_only: Api.Helpers.company_read_only(conn)) do
      {:ok, person}
    else
      false -> {:error, :forbidden}
      error -> error
    end
  end

  def load(conn, type, id, field), do: TemplateResources.load(conn, type, id, field)

  def save(conn, :project, record, content), do: Api.Projects.UpdateDescription.call(conn, %{project_id: record.id, description: content})
  def save(conn, :kpi, record, content), do: Api.Kpis.EditKpi.call(conn, %{kpi_id: record.id, description: content})
  def save(conn, :goal, record, content), do: Api.Goals.UpdateDescription.call(conn, %{goal_id: record.id, description: content})
  def save(conn, :task, record, content), do: Api.Tasks.UpdateDescription.call(conn, %{task_id: record.id, type: if(record.project_id, do: :project, else: :space), description: content})
  def save(conn, :milestone, record, content), do: Api.Projects.Milestones.UpdateDescription.call(conn, %{milestone_id: record.id, description: content})
  def save(conn, :file, record, content), do: Api.Files.Update.call(conn, %{file_id: record.id, name: record.name, description: content})
  def save(conn, :link, record, content), do: Api.Links.Update.call(conn, %{link_id: record.id, name: record.name, type: record.type, url: record.url, description: content})
  def save(conn, :person, record, content), do: Api.People.Update.call(conn, %{id: record.id, description: content})
  def save(conn, :comment, record, content), do: Api.Comments.Update.call(conn, %{comment_id: record.id, parent_type: comment_parent_type(record), content: content})
  def save(conn, :space_discussion, record, content), do: Api.Spaces.UpdateDiscussion.call(conn, %{id: record.id, body: content})

  def save(conn, :document, record, content) do
    record = Repo.preload(record, [:node, :resource_hub])

    Operately.Operations.ResourceHubDocumentEditing.run(Api.Helpers.me(conn), record, %{
      name: record.name,
      content: content,
      expected_version: record.current_version
    })
  end

  def save(conn, :project_discussion, record, content) do
    record = Repo.preload(record, subscription_list: :subscriptions)
    subscriber_ids = Enum.map(record.subscription_list.subscriptions, & &1.person_id)
    Api.Projects.Discussions.Update.call(conn, %{id: record.id, title: record.title, message: content, subscriber_ids: subscriber_ids})
  end

  def save(conn, :goal_discussion, record, content) do
    Api.Goals.UpdateDiscussion.call(conn, %{activity_id: record.activity.id, title: record.title, message: content})
  end

  def save(conn, :project_check_in, record, content) do
    Api.Projects.UpdateCheckIn.call(conn, %{check_in_id: record.id, status: record.status, description: content})
  end

  def save(conn, :goal_check_in, record, content) do
    record = Repo.preload(record, goal: [:targets, :checks])
    Operately.Operations.GoalCheckInEdit.run_content_edit(Api.Helpers.me(conn), record.goal, record, content)
  end

  def save(conn, :project_retrospective, record, content) do
    record = Repo.preload(record, :project)
    Api.Projects.UpdateRetrospective.call(conn, %{retrospective_id: record.id, content: content, success_status: record.project.success_status})
  end

  def save(conn, type, record, content), do: TemplateResources.save(conn, type, record, content)

  defp check_permission(conn, :goal_check_in, record, _permissions, _permission) do
    Operately.Goals.Update.Permissions.check(record.request_info.access_level, record, Api.Helpers.me(conn).id, :can_edit, company_read_only: Api.Helpers.company_read_only(conn))
  end

  defp check_permission(conn, _type, record, permissions, permission) do
    permissions.check(record.request_info.access_level, permission, company_read_only: Api.Helpers.company_read_only(conn))
  end

  defp prepare(type, record) when type in [:project_discussion, :goal_discussion] do
    record = Repo.preload(record, :activity)
    expected_action = if type == :project_discussion, do: "project_discussion_submitted", else: "goal_discussion_creation"
    if record.activity && record.activity.action == expected_action, do: {:ok, record}, else: {:error, :not_found}
  end

  defp prepare(_, record), do: {:ok, record}

  defp check_draft(type, record, me) when type in [:project_check_in, :goal_check_in], do: Api.Helpers.check_draft_access(record, me)
  defp check_draft(_, _, _), do: {:ok, :allowed}

  defp comment_parent_type(%{entity_type: :project_milestone}), do: :milestone
  defp comment_parent_type(%{entity_type: :comment_thread}), do: :project_discussion
  defp comment_parent_type(%{entity_type: :update}), do: :goal_discussion
  defp comment_parent_type(comment), do: comment.entity_type
end
