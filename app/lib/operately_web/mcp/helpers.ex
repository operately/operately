defmodule OperatelyWeb.Mcp.Helpers do
  import Ecto.Query

  alias Operately.Activities.Activity
  alias Operately.Access.Binding
  alias Operately.ContextualDates.ContextualDate
  alias Operately.Groups.Group
  alias Operately.Repo
  alias Operately.RichContent.Builder
  alias Operately.RichContent.FromMarkdown
  alias Operately.Tasks.Task
  alias OperatelyWeb.Api.Comments.List, as: CommentsList
  alias OperatelyWeb.Api.Helpers, as: ApiHelpers

  @comment_parent_types %{
    "goal_check_in" => :goal_update,
    "project_check_in" => :project_check_in,
    "goal_discussion" => :goal_discussion,
    "project_discussion" => :project_discussion,
    "space_discussion" => :message,
    "milestone" => :milestone,
    "document" => :resource_hub_document,
    "file" => :resource_hub_file,
    "link" => :resource_hub_link,
    "project_task" => :project_task,
    "space_task" => :space_task
  }

  def decode_id(id) when is_binary(id) do
    case ApiHelpers.decode_id(id) do
      {:ok, decoded_id} -> {:ok, decoded_id}
      {:error, _reason} -> {:error, :invalid_arguments}
    end
  end

  def decode_optional_id(nil), do: {:ok, nil}
  def decode_optional_id(id), do: decode_id(id)

  def decode_id_list(nil), do: {:ok, []}

  def decode_id_list(ids) when is_list(ids) do
    ids
    |> Enum.reduce_while({:ok, []}, fn id, {:ok, acc} ->
      case decode_id(id) do
        {:ok, decoded_id} -> {:cont, {:ok, [decoded_id | acc]}}
        {:error, _} = error -> {:halt, error}
      end
    end)
    |> case do
      {:ok, decoded_ids} -> {:ok, Enum.reverse(decoded_ids)}
      error -> error
    end
  end

  def decode_id_list(_ids), do: {:error, :invalid_arguments}

  def put_optional(map, _key, nil), do: map
  def put_optional(map, key, value), do: Map.put(map, key, value)

  def markdown_to_rich_text(content) do
    FromMarkdown.to_rich_text(content)
  end

  def markdown_to_rich_text_allow_blank(content) when is_binary(content) do
    if String.trim(content) == "" do
      {:ok, Builder.empty_content()}
    else
      FromMarkdown.to_rich_text(content)
    end
  end

  def markdown_to_rich_text_allow_blank(_content), do: {:error, :invalid_arguments}

  def parse_day_date(nil), do: {:ok, nil}

  def parse_day_date(date) when is_binary(date) do
    {:ok, ContextualDate.from_string(date, :day)}
  rescue
    _ -> {:error, :invalid_arguments}
  end

  def parse_day_date(_date), do: {:error, :invalid_arguments}

  def load_task(person, task_id, preloads \\ [:project, :space]) do
    Task.get(person, id: task_id, opts: [preload: preloads])
  end

  def resolve_task_type(%Task{} = task) do
    cond do
      Map.get(task, :project_id) -> {:ok, :project}
      Map.get(task, :space_id) -> {:ok, :space}
      Ecto.assoc_loaded?(task.project) and task.project -> {:ok, :project}
      Ecto.assoc_loaded?(task.space) and task.space -> {:ok, :space}
      true -> {:error, :invalid_arguments}
    end
  end

  def resolve_task_status(%Task{} = task, status_identifier) when is_binary(status_identifier) do
    task
    |> task_statuses()
    |> Enum.find(fn status ->
      status.id == status_identifier or
        status.value == status_identifier or
        String.downcase(status.label || "") == String.downcase(status_identifier)
    end)
    |> case do
      nil -> {:error, :invalid_arguments}
      status -> {:ok, status}
    end
  end

  def resolve_task_status(_task, _status_identifier), do: {:error, :invalid_arguments}

  def comment_parent_type_values, do: Map.keys(@comment_parent_types)

  def decode_comment_parent_type(parent_type) when is_binary(parent_type) do
    case Map.fetch(@comment_parent_types, parent_type) do
      {:ok, entity_type} -> {:ok, entity_type}
      :error -> {:error, :invalid_arguments}
    end
  end

  def decode_comment_parent_type(_parent_type), do: {:error, :invalid_arguments}

  def goal_discussion_activity_id(comment_thread_id) do
    from(a in Activity,
      where: a.comment_thread_id == ^comment_thread_id and a.action == "goal_discussion_creation",
      select: a.id,
      limit: 1
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      activity_id -> {:ok, activity_id}
    end
  end

  def load_space_with_access_levels(person, space_id) do
    with {:ok, space} <- Group.get(person, id: space_id) do
      {:ok, Group.preload_access_levels(space)}
    end
  end

  def default_space_create_permissions do
    %{
      anonymous: Binding.no_access(),
      company: Binding.comment_access()
    }
  end

  def default_nested_access_levels(%{access_levels: access_levels}) do
    %{
      anonymous: access_levels.public || Binding.no_access(),
      company: access_levels.company || Binding.no_access(),
      space: max(access_levels.company || Binding.no_access(), Binding.comment_access())
    }
  end

  def load_comments(conn, entity_id, entity_type) do
    {:ok, %{comments: comments}} =
      CommentsList.call(conn, %{entity_id: entity_id, entity_type: entity_type})

    comments
  end

  defp task_statuses(task), do: Task.available_statuses(task)
end
