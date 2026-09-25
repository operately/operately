defmodule OperatelyWeb.Api.RichContent.TemplateResources do
  alias Operately.ProjectTemplates, as: Templates
  alias OperatelyWeb.Api.ProjectTemplates, as: Api
  alias OperatelyWeb.Api.Helpers
  alias Operately.Repo

  @resources %{
    project_template: {Templates.ProjectTemplate, :description, Api.Update, :id},
    template_task: {Templates.Task, :description, Api.UpdateTask, :task_id},
    template_milestone: {Templates.Milestone, :description, Api.UpdateMilestone, :milestone_id},
    template_discussion: {Templates.Discussion, :body, Api.UpdateDiscussion, :discussion_id},
    template_comment: {Templates.Comment, :content, Api.UpdateComment, :comment_id},
    template_document: {Templates.ResourceDocument, :content, Api.UpdateDocument, :document_id},
    template_file: {Templates.ResourceFile, :description, Api.UpdateFile, :file_id},
    template_link: {Templates.ResourceLink, :description, Api.UpdateLink, :link_id}
  }

  def types, do: Map.keys(@resources)

  def load(conn, type, id, field) when is_map_key(@resources, type) do
    {schema, expected_field, _, _} = Map.fetch!(@resources, type)
    me = Helpers.me(conn)

    with true <- field == expected_field,
         %{} = record <- Repo.get(schema, id),
         record <- preload_parent(record),
         {:ok, template} <- Templates.ProjectTemplate.get(me, id: template_id(record), company_id: me.company_id),
         :ok <- check_archived(template),
         {:ok, _} <- Templates.Permissions.check(template.request_info.access_level, :can_edit, company_read_only: Helpers.company_read_only(conn)) do
      {:ok, record}
    else
      nil -> {:error, :not_found}
      false -> {:error, :bad_request}
      error -> error
    end
  end

  def load(_, _, _, _), do: {:error, :bad_request}

  def save(conn, type, record, content) do
    {_, field, mutation, id_field} = Map.fetch!(@resources, type)
    inputs = Map.merge(preserved_fields(type, record), %{id_field => record.id, field => content})
    inputs = if type == :project_template, do: inputs, else: Map.put(inputs, :template_id, template_id(record))
    mutation.call(conn, inputs)
  end

  defp check_archived(%{archived_at: nil}), do: :ok
  defp check_archived(_), do: {:error, :forbidden}

  defp preserved_fields(:template_discussion, record), do: %{title: record.title}
  defp preserved_fields(type, record) when type in [:template_document, :template_file], do: %{name: record.name}
  defp preserved_fields(:template_link, record), do: Map.take(record, [:name, :url, :type])
  defp preserved_fields(_, _), do: %{}

  defp preload_parent(%{node_id: _} = record), do: Repo.preload(record, :node)
  defp preload_parent(record), do: record

  defp template_id(%Templates.ProjectTemplate{id: id}), do: id
  defp template_id(%{project_template_id: id}), do: id
  defp template_id(%{node: node}), do: node.project_template_id
end
