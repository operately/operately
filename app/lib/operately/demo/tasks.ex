defmodule Operately.Demo.Tasks do
  alias Operately.ContextualDates.ContextualDate
  alias Operately.Demo.{Resources, RichText, Comments}
  alias Operately.Notifications
  alias Operately.Tasks

  def create_task(resources, attrs, assignee_id \\ nil) do
    {comments, attrs} = Map.pop(attrs, :comments)

    {:ok, subscription_list} = Notifications.create_subscription_list()

    attrs =
      attrs
      |> Map.put(:subscription_list_id, subscription_list.id)
      |> normalize_task_attrs()

    {:ok, task} = Tasks.create_task(attrs)

    {:ok, _} =
      Notifications.update_subscription_list(subscription_list, %{
        parent_type: :project_task,
        parent_id: task.id
      })

    if assignee_id do
      {:ok, _} = Tasks.create_assignee(%{task_id: task.id, person_id: assignee_id})
    end

    Comments.create_comments(resources, task, comments)

    task
  end

  def build_due_date(nil), do: nil
  def build_due_date(%Date{} = date), do: ContextualDate.create_day_date(date)

  def resolve_assignee(_resources, nil), do: nil
  def resolve_assignee(resources, assignee_key), do: Resources.get(resources, assignee_key)

  def resolve_task_status(scope, nil), do: default_status(scope)

  def resolve_task_status(scope, status) do
    value = to_string(status)

    scope.task_statuses
    |> List.wrap()
    |> Enum.find(fn task_status ->
      to_string(task_status.value || task_status.id) == value
    end)
    |> case do
      nil -> default_status(scope)
      task_status -> task_status
    end
  end

  def task_status_attrs(task_status) do
    %{
      id: task_status.id,
      label: task_status.label,
      color: task_status.color,
      index: task_status.index,
      value: task_status.value,
      closed: task_status.closed
    }
  end

  def normalize_description(nil), do: RichText.from_string("")
  def normalize_description(text) when is_binary(text), do: RichText.from_string(text)
  def normalize_description(map) when is_map(map), do: map

  def normalize_due_date(nil, _status), do: nil
  def normalize_due_date(%Date{} = due_date, nil), do: due_date

  def normalize_due_date(%Date{} = due_date, status) do
    if status.closed do
      due_date
    else
      case Date.compare(due_date, Date.utc_today()) do
        :lt -> bump_due_date(due_date)
        _ -> due_date
      end
    end
  end

  defp normalize_task_attrs(attrs) do
    attrs
    |> Map.update(:description, RichText.from_string(""), &normalize_description/1)
    |> Map.update(:task_status, nil, fn status ->
      if status, do: task_status_attrs(status), else: nil
    end)
  end

  defp default_status(%Operately.Projects.Project{} = project) do
    Operately.Projects.Project.get_default_task_status(project)
  end

  defp default_status(%Operately.Groups.Group{} = space) do
    Operately.Groups.Group.get_default_task_status(space)
  end

  defp bump_due_date(due_date) do
    days_overdue = Date.diff(Date.utc_today(), due_date)
    bump = 3 + rem(days_overdue, 10)
    Date.add(Date.utc_today(), bump)
  end
end
