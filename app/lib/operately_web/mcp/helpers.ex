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

  def decode_hub_scope(%{"space_id" => _space_id, "project_id" => _project_id}), do: {:error, :invalid_arguments}
  def decode_hub_scope(%{"space_id" => _space_id, "goal_id" => _goal_id}), do: {:error, :invalid_arguments}
  def decode_hub_scope(%{"project_id" => _project_id, "goal_id" => _goal_id}), do: {:error, :invalid_arguments}

  def decode_hub_scope(%{"space_id" => space_id}) do
    with {:ok, space_id} <- decode_id(space_id) do
      {:ok, %{space_id: space_id}}
    end
  end

  def decode_hub_scope(%{"project_id" => project_id}) do
    with {:ok, project_id} <- decode_id(project_id) do
      {:ok, %{project_id: project_id}}
    end
  end

  def decode_hub_scope(%{"goal_id" => goal_id}) do
    with {:ok, goal_id} <- decode_id(goal_id) do
      {:ok, %{goal_id: goal_id}}
    end
  end

  def decode_hub_scope(_arguments), do: {:error, :invalid_arguments}

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

  def decode_notification_inputs(arguments) do
    with {:ok, subscriber_ids} <- decode_id_list(arguments["notify_person_ids"]),
         {:ok, notify_everyone} <- decode_optional_boolean(arguments["notify_everyone"]) do
      {:ok,
       %{
         subscriber_ids: subscriber_ids,
         send_notifications_to_everyone: notify_everyone
       }}
    end
  end

  def decode_optional_notification_inputs(arguments) do
    if Map.has_key?(arguments, "notify_person_ids") or Map.has_key?(arguments, "notify_everyone") do
      decode_notification_inputs(arguments)
    else
      {:ok, %{}}
    end
  end

  def access_level_values do
    Binding.valid_access_levels(:as_atom) |> Enum.map(&Atom.to_string/1)
  end

  def decode_access_level(value, allowed_values \\ access_level_values())

  def decode_access_level(value, allowed_values) when is_binary(value) do
    if value in allowed_values, do: {:ok, String.to_atom(value)}, else: {:error, :invalid_arguments}
  end

  def decode_access_level(_value, _allowed_values), do: {:error, :invalid_arguments}

  def parse_datetime(nil), do: {:ok, nil}

  def parse_datetime(value) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, datetime, _offset} -> {:ok, datetime}
      {:error, _reason} -> {:error, :invalid_arguments}
    end
  end

  def parse_datetime(_value), do: {:error, :invalid_arguments}

  def markdown_to_rich_text_nullable(nil), do: {:ok, nil}
  def markdown_to_rich_text_nullable(content), do: markdown_to_rich_text_allow_blank(content)

  def put_present(inputs, arguments, argument_key, input_key, decoder \\ &{:ok, &1}) do
    if Map.has_key?(arguments, argument_key) do
      with {:ok, value} <- decoder.(arguments[argument_key]) do
        {:ok, Map.put(inputs, input_key, value)}
      end
    else
      {:ok, inputs}
    end
  end

  def put_optional(map, _key, nil), do: map
  def put_optional(map, key, value), do: Map.put(map, key, value)

  def decode_enum(value, allowed) when is_binary(value) do
    if value in allowed, do: {:ok, String.to_atom(value)}, else: {:error, :invalid_arguments}
  end

  def decode_enum(_value, _allowed), do: {:error, :invalid_arguments}

  def decode_optional_enum(nil, _allowed), do: {:ok, nil}
  def decode_optional_enum(value, allowed), do: decode_enum(value, allowed)

  def parse_iso_date(value) when is_binary(value) do
    case Date.from_iso8601(value) do
      {:ok, date} -> {:ok, date}
      {:error, _reason} -> {:error, :invalid_arguments}
    end
  end

  def parse_iso_date(_value), do: {:error, :invalid_arguments}

  # MCP-facing names use "contributor"; API/domain keep Person / people.
  def present_project_template_result({:ok, %{template: template} = result}) do
    {:ok, %{result | template: present_project_template(template)}}
  end

  def present_project_template_result({:ok, %{templates: templates} = result}) do
    {:ok, %{result | templates: Enum.map(templates, &present_project_template/1)}}
  end

  def present_project_template_result({:ok, %{assignments: assignments} = result}) do
    {:ok, %{result | assignments: Enum.map(assignments, &present_project_template_assignment/1)}}
  end

  def present_project_template_result(other), do: other

  def present_project_template(nil), do: nil

  def present_project_template(template) when is_map(template) do
    template
    |> rename_map_key(:people, :contributors)
    |> rename_map_key(:inactive_people_summary, :inactive_contributors_summary)
    |> present_project_template_task_assignments()
  end

  def decode_task_reminders(reminders) when is_list(reminders) do
    Enum.reduce_while(reminders, {:ok, []}, fn reminder, {:ok, decoded} ->
      case decode_task_reminder(reminder) do
        {:ok, value} -> {:cont, {:ok, [value | decoded]}}
        error -> {:halt, error}
      end
    end)
    |> case do
      {:ok, decoded} -> {:ok, Enum.reverse(decoded)}
      error -> error
    end
  end

  def decode_task_reminders(_reminders), do: {:error, :invalid_arguments}

  def decode_template_task_status(%{"id" => id}) when is_binary(id), do: {:ok, %{id: id}}
  def decode_template_task_status(_status), do: {:error, :invalid_arguments}

  def decode_template_task_statuses(statuses) when is_list(statuses) do
    {:ok, Enum.map(statuses, &atomize_known_keys(&1, ~w(id label color index value closed)))}
  end

  def decode_template_task_statuses(_statuses), do: {:error, :invalid_arguments}

  def decode_status_replacements(replacements) when is_list(replacements) do
    {:ok, Enum.map(replacements, &atomize_known_keys(&1, ~w(deleted_status_id replacement_status_id)))}
  end

  def decode_status_replacements(_replacements), do: {:error, :invalid_arguments}

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

  defp decode_optional_boolean(nil), do: {:ok, false}
  defp decode_optional_boolean(value) when is_boolean(value), do: {:ok, value}
  defp decode_optional_boolean(_), do: {:error, :invalid_arguments}

  defp task_statuses(task), do: Task.available_statuses(task)

  defp present_project_template_task_assignments(%{task_assignments: assignments} = template) when is_list(assignments) do
    %{template | task_assignments: Enum.map(assignments, &present_project_template_assignment/1)}
  end

  defp present_project_template_task_assignments(template), do: template

  defp present_project_template_assignment(assignment) when is_map(assignment) do
    rename_map_key(assignment, :project_template_person_id, :contributor_id)
  end

  defp rename_map_key(map, from, to) do
    case Map.pop(map, from) do
      {nil, _} -> map
      {value, rest} -> Map.put(rest, to, value)
    end
  end

  defp decode_task_reminder(%{"type" => "before_due", "days" => days}) when is_integer(days) and days > 0 do
    {:ok, %{type: :before_due, days: days}}
  end

  defp decode_task_reminder(%{"type" => type}) when type in ["due_day", "overdue"] do
    {:ok, %{type: String.to_atom(type)}}
  end

  defp decode_task_reminder(_reminder), do: {:error, :invalid_arguments}

  defp atomize_known_keys(map, keys) do
    Enum.reduce(keys, %{}, fn key, result ->
      if Map.has_key?(map, key), do: Map.put(result, String.to_existing_atom(key), map[key]), else: result
    end)
  end
end
