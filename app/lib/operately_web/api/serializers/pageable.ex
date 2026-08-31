defprotocol OperatelyWeb.Api.Pageable do
  @moduledoc """
  Canonical in-app page path for a resource that the API serializes.

  Returns `nil` when the resource has no page, or `{field, path}` where `field`
  is `:url` (or `:page_url` when `:url` already means something else).
  """

  @fallback_to_any true
  def page_url(resource, company)
end

defimpl OperatelyWeb.Api.Pageable, for: Any do
  def page_url(_resource, _company), do: nil
end

defimpl OperatelyWeb.Api.Pageable, for: Operately.Groups.Group do
  def page_url(space, company), do: {:url, OperatelyWeb.Paths.space_path(company, space)}
end

defimpl OperatelyWeb.Api.Pageable, for: Operately.Projects.Project do
  def page_url(project, company), do: {:url, OperatelyWeb.Paths.project_path(company, project)}
end

defimpl OperatelyWeb.Api.Pageable, for: Operately.Goals.Goal do
  def page_url(goal, company), do: {:url, OperatelyWeb.Paths.goal_path(company, goal)}
end

defimpl OperatelyWeb.Api.Pageable, for: Operately.Projects.Milestone do
  def page_url(milestone, company), do: {:url, OperatelyWeb.Paths.project_milestone_path(company, milestone)}
end

defimpl OperatelyWeb.Api.Pageable, for: Operately.People.Person do
  def page_url(person, company), do: {:url, OperatelyWeb.Paths.person_path(company, person)}
end

defimpl OperatelyWeb.Api.Pageable, for: Operately.Tasks.Task do
  alias Operately.Groups.Group
  alias OperatelyWeb.Paths

  def page_url(%{project_id: nil, space: %Group{} = space} = task, company) do
    {:url, Paths.space_task_path(company, space, task)}
  end

  def page_url(%{project_id: nil}, _company), do: nil
  def page_url(task, company), do: {:url, Paths.project_task_path(company, task)}
end

defimpl OperatelyWeb.Api.Pageable, for: Operately.ResourceHubs.Folder do
  def page_url(folder, company), do: {:url, OperatelyWeb.Paths.folder_path(company, folder)}
end

defimpl OperatelyWeb.Api.Pageable, for: Operately.ResourceHubs.Document do
  def page_url(document, company), do: {:url, OperatelyWeb.Paths.document_path(company, document)}
end

defimpl OperatelyWeb.Api.Pageable, for: Operately.ResourceHubs.File do
  def page_url(file, company), do: {:url, OperatelyWeb.Paths.file_path(company, file)}
end

defimpl OperatelyWeb.Api.Pageable, for: Operately.ResourceHubs.Link do
  def page_url(link, company), do: {:page_url, OperatelyWeb.Paths.link_path(company, link)}
end

defimpl OperatelyWeb.Api.Pageable, for: Operately.Search.Result do
  alias Operately.Goals.Goal
  alias Operately.Groups.Group
  alias Operately.People.Person
  alias Operately.Projects.{Milestone, Project}
  alias Operately.Tasks.Task
  alias OperatelyWeb.Paths

  def page_url(result, company) do
    case search_path(company, result) do
      nil -> nil
      path -> {:url, path}
    end
  end

  defp search_path(company, %{type: :resource_hub_folder, navigation_target: target}) do
    folder_id = target[:folder_id]
    if folder_id, do: Paths.folder_path(company, folder_id)
  end

  defp search_path(company, %{type: :resource_hub_document, navigation_target: target}) do
    document_id = target[:document_id]
    if document_id, do: Paths.document_path(company, %{id: document_id})
  end

  defp search_path(company, %{type: :resource_hub_file, navigation_target: target}) do
    file_id = target[:file_id]
    if file_id, do: Paths.file_path(company, %{id: file_id})
  end

  defp search_path(company, %{type: :resource_hub_link, navigation_target: target}) do
    link_id = target[:link_id]
    if link_id, do: Paths.link_path(company, %{id: link_id})
  end

  defp search_path(company, %{type: :project, title: title, navigation_target: target}) do
    project_id = target[:project_id]
    if project_id, do: Paths.project_path(company, %Project{id: project_id, name: title})
  end

  defp search_path(company, %{type: :goal, title: title, navigation_target: target}) do
    goal_id = target[:goal_id]
    if goal_id, do: Paths.goal_path(company, %Goal{id: goal_id, name: title})
  end

  defp search_path(company, %{type: :milestone, title: title, navigation_target: target}) do
    milestone_id = target[:milestone_id]
    if milestone_id, do: Paths.project_milestone_path(company, %Milestone{id: milestone_id, title: title})
  end

  defp search_path(company, %{type: :task, title: title, navigation_target: %{project_id: project_id} = target}) when not is_nil(project_id) do
    task_id = target[:task_id]
    if task_id, do: Paths.project_task_path(company, %Task{id: task_id, name: title})
  end

  defp search_path(company, %{type: :task, title: title, context: context, navigation_target: %{space_id: space_id} = target}) when not is_nil(space_id) do
    task_id = target[:task_id]

    if task_id do
      Paths.space_task_path(company, %Group{id: space_id, name: context}, %Task{id: task_id, name: title})
    end
  end

  defp search_path(_company, %{type: :task}), do: nil

  defp search_path(company, %{type: :person, title: title, navigation_target: target}) do
    person_id = target[:person_id]
    if person_id, do: Paths.person_path(company, %Person{id: person_id, full_name: title})
  end

  defp search_path(company, %{type: :discussion, title: title, navigation_target: target}) do
    discussion_id = target[:discussion_id]
    if discussion_id, do: Paths.message_path(company, %{id: discussion_id, title: title})
  end

  defp search_path(company, %{type: :project_check_in, inserted_at: inserted_at, navigation_target: target}) do
    check_in_id = target[:project_check_in_id]
    if check_in_id, do: Paths.project_check_in_path(company, %{id: check_in_id, inserted_at: inserted_at})
  end

  defp search_path(company, %{type: :goal_check_in, navigation_target: target}) do
    update_id = target[:goal_check_in_id]
    if update_id, do: Paths.goal_check_in_path(company, update_id)
  end

  defp search_path(company, %{type: :project_retrospective, title: title, navigation_target: target}) do
    project_id = target[:project_id]
    if project_id, do: Paths.project_retrospective_path(company, %Project{id: project_id, name: title})
  end

  defp search_path(_company, _result), do: nil
end
