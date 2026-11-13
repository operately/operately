defmodule OperatelyWeb.Api.Wrappers.Notifications.ResourceSubscription do
  @resource_modules [
    project_check_in: Operately.Projects.CheckIn,
    project_retrospective: Operately.Projects.Retrospective,
    goal_update: Operately.Goals.Update,
    message: Operately.Messages.Message,
    resource_hub_document: Operately.ResourceHubs.Document,
    resource_hub_file: Operately.ResourceHubs.File,
    resource_hub_link: Operately.ResourceHubs.Link,
    comment_thread: Operately.Comments.CommentThread,
    project: Operately.Projects.Project,
    milestone: Operately.Projects.Milestone,
    project_task: Operately.Tasks.Task,
    space_task: Operately.Tasks.Task,
    kpi: Operately.Kpis.Kpi
  ]

  def resource_types, do: Keyword.keys(@resource_modules)

  def resolve(me, %{resource_id: id, resource_type: type}) do
    with {:ok, module} <- resource_module(type),
         {:ok, resource} <- module.get(me, id: id, opts: [preload: :subscription_list]),
         %{id: list_id, parent_type: parent_type} <- resource.subscription_list,
         true <- parent_type == subscription_parent_type(type) do
      {:ok, list_id}
    else
      {:error, _} = error -> error
      _ -> {:error, :not_found}
    end
  end

  defp resource_module(type) do
    case Keyword.fetch(@resource_modules, type) do
      {:ok, module} -> {:ok, module}
      :error -> {:error, :bad_request}
    end
  end

  defp subscription_parent_type(:milestone), do: :project_milestone
  defp subscription_parent_type(type), do: type
end
