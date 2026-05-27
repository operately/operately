defmodule Operately.Notifications.DirectMentionClassifier do
  import Ecto.Query, warn: false

  alias Operately.Notifications.Notification
  alias Operately.Repo
  alias Operately.Comments.CommentThread
  alias Operately.Goals.Goal
  alias Operately.Goals.Update
  alias Operately.Messages.Message
  alias Operately.Projects.CheckIn
  alias Operately.Projects.Retrospective
  alias Operately.ResourceHubs.Document
  alias Operately.Updates.Comment

  @project_milestone_exception "project_milestone_commented"

  @rich_content_actions [
    {"project_description_changed", "description"},
    {"project_created", "description"},
    {"task_description_change", "description"},
    {"task_adding", "description"},
    {"milestone_description_updating", "description"},
    {"goal_description_changed", "new_description"},
    {"resource_hub_document_edited", "content"}
  ]

  @preloaded_content_actions [
    {"comment_added", %{resource: :comment, resource_id: {:content, "comment_id"}}},
    {"project_check_in_commented", %{resource: :comment, resource_id: {:content, "comment_id"}}},
    {"goal_check_in_commented", %{resource: :comment, resource_id: {:content, "comment_id"}}},
    {"project_retrospective_commented", %{resource: :comment, resource_id: {:content, "comment_id"}}},
    {"goal_created", %{resource: :goal, resource_id: {:content, "goal_id"}}},
    {"project_task_commented", %{resource: :comment, resource_id: {:content, "comment_id"}}},
    {"space_task_commented", %{resource: :comment, resource_id: {:content, "comment_id"}}},
    {"discussion_comment_submitted", %{resource: :comment, resource_id: {:content, "comment_id"}}},
    {"discussion_posting", %{resource: :message, resource_id: {:content, "discussion_id"}}},
    {"discussion_editing", %{resource: :message, resource_id: {:content, "discussion_id"}}},
    {"goal_check_in", %{resource: :goal_update, resource_id: {:content, "update_id"}}},
    {"project_check_in_submitted", %{resource: :project_check_in, resource_id: {:content, "check_in_id"}}},
    {"project_discussion_submitted", %{resource: :comment_thread, resource_id: {:content, "discussion_id"}}},
    {"goal_closing", %{resource: :comment_thread, resource_id: {:activity, :comment_thread_id}}},
    {"goal_discussion_creation", %{resource: :comment_thread, resource_id: {:activity, :comment_thread_id}}},
    {"goal_reopening", %{resource: :comment_thread, resource_id: {:activity, :comment_thread_id}}},
    {"goal_timeframe_editing", %{resource: :comment_thread, resource_id: {:activity, :comment_thread_id}}},
    {"project_resuming", %{resource: :comment_thread, resource_id: {:activity, :comment_thread_id}}},
    {"project_closed", %{resource: :project_retrospective, resource_id: {:content, "retrospective_id"}}},
    {"resource_hub_document_created", %{resource: :resource_hub_document, resource_id: {:content, "document_id"}}},
    {"resource_hub_document_commented", %{resource: :comment, resource_id: {:content, "comment_id"}}},
    {"resource_hub_file_commented", %{resource: :comment, resource_id: {:content, "comment_id"}}},
    {"resource_hub_link_commented", %{resource: :comment, resource_id: {:content, "comment_id"}}}
  ]

  @never_mention_actions [
    "company_adding",
    "company_admin_added",
    "company_admin_removed",
    "company_editing",
    "company_invitation_token_created",
    "company_member_added",
    "company_member_converted_to_guest",
    "company_member_joined",
    "company_member_removed",
    "company_member_restoring",
    "company_members_permissions_edited",
    "company_owner_removing",
    "company_owners_adding",
    "guest_invited",
    "password_first_time_changed",
    "group_edited",
    "message_archiving",
    "space_added",
    "space_joining",
    "space_member_removed",
    "space_members_added",
    "space_members_permissions_edited",
    "space_permissions_edited",
    "goal_archived",
    "goal_champion_updating",
    "goal_check_adding",
    "goal_check_in_acknowledgement",
    "goal_check_in_edit",
    "goal_check_removing",
    "goal_check_toggled",
    "goal_discussion_editing",
    "goal_due_date_changed",
    "goal_due_date_updating",
    "goal_editing",
    "goal_name_updating",
    "goal_reparent",
    "goal_reviewer_updating",
    "goal_space_updating",
    "goal_start_date_updating",
    "goal_target_adding",
    "goal_target_deleting",
    "goal_target_updating",
    "milestone_deleting",
    "milestone_due_date_updating",
    "milestone_title_updating",
    "project_archived",
    "project_champion_updating",
    "project_check_in_acknowledged",
    "project_check_in_edit",
    "project_contributions_addition",
    "project_contributor_addition",
    "project_contributor_edited",
    "project_contributor_removed",
    "project_contributors_addition",
    "project_due_date_updating",
    "project_goal_connection",
    "project_goal_disconnection",
    "project_key_resource_added",
    "project_key_resource_deleted",
    "project_milestone_creation",
    "project_milestone_updating",
    "project_moved",
    "project_pausing",
    "project_permissions_edited",
    "project_renamed",
    "project_retrospective_edited",
    "project_reviewer_updating",
    "project_start_date_updating",
    "project_timeline_edited",
    "task_assignee_assignment",
    "task_assignee_updating",
    "task_closing",
    "task_deleting",
    "task_due_date_updating",
    "task_milestone_updating",
    "task_moving",
    "task_name_editing",
    "task_name_updating",
    "task_priority_change",
    "task_reopening",
    "task_size_change",
    "task_status_change",
    "task_status_updating",
    "task_update",
    "resource_hub_created",
    "resource_hub_document_deleted",
    "resource_hub_file_created",
    "resource_hub_file_deleted",
    "resource_hub_file_edited",
    "resource_hub_folder_copied",
    "resource_hub_folder_created",
    "resource_hub_folder_deleted",
    "resource_hub_folder_renamed",
    "resource_hub_link_created",
    "resource_hub_link_deleted",
    "resource_hub_link_edited",
    "resource_hub_parent_folder_edited"
  ]

  def classify(notifications) when is_list(notifications) do
    preloaded = preload_contents(notifications)

    notifications
    |> Enum.into(%{}, fn notification ->
      {notification.id, directly_mentions_recipient?(notification, preloaded)}
    end)
  end

  def directly_mentions_recipient?(%Notification{} = notification, preloaded) when is_map(preloaded) do
    action = action_for(notification.activity)
    recipient_id = notification.person_id
    rich_content_key = rich_content_key(action)
    preloaded_spec = preloaded_content_spec(action)

    cond do
      rich_content_key ->
        notification
        |> activity_content_value(rich_content_key)
        |> has_mention?(recipient_id)

      preloaded_spec ->
        notification
        |> extract_resource_id(preloaded_spec)
        |> lookup_preloaded_content(preloaded, preloaded_spec)
        |> has_mention?(recipient_id)

      action == @project_milestone_exception ->
        project_milestone_mentions_recipient?(notification, preloaded, recipient_id)

      action in @never_mention_actions ->
        false

      true ->
        raise "Activity not handled in direct mention classification #{inspect(action)}"
    end
  end

  defp preload_contents(notifications) do
    notifications
    |> Enum.reduce(%{}, fn notification, acc ->
      case preload_request(notification) do
        nil -> acc
        {resource, resource_id} -> accumulate_preload(acc, resource, resource_id)
      end
    end)
    |> Enum.into(%{}, fn {resource, ids} ->
      {resource, load_preloaded_resource(resource, MapSet.to_list(ids))}
    end)
  end

  defp preload_request(notification) do
    action = action_for(notification.activity)
    preloaded_spec = preloaded_content_spec(action)

    cond do
      preloaded_spec ->
        notification
        |> extract_resource_id(preloaded_spec)
        |> to_preload_request(preloaded_spec.resource)

      action == @project_milestone_exception ->
        project_milestone_preload_request(notification)

      true ->
        nil
    end
  end

  defp project_milestone_preload_request(notification) do
    if activity_content_value(notification, "comment_action") == "none" do
      notification
      |> activity_content_value("comment_id")
      |> to_preload_request(:comment)
    else
      nil
    end
  end

  defp project_milestone_mentions_recipient?(notification, preloaded, recipient_id) do
    if activity_content_value(notification, "comment_action") == "none" do
      spec = %{resource: :comment}

      notification
      |> activity_content_value("comment_id")
      |> lookup_preloaded_content(preloaded, spec)
      |> has_mention?(recipient_id)
    else
      false
    end
  end

  defp to_preload_request(nil, _resource), do: nil
  defp to_preload_request(resource_id, resource), do: {resource, resource_id}

  defp accumulate_preload(preloaded, resource, resource_id) do
    Map.update(preloaded, resource, MapSet.new([resource_id]), &MapSet.put(&1, resource_id))
  end

  defp load_preloaded_resource(_resource, []), do: %{}

  defp load_preloaded_resource(:comment, ids) do
    from(c in Comment, where: c.id in ^ids, select: {c.id, c.content})
    |> Repo.all()
    |> Enum.into(%{})
  end

  defp load_preloaded_resource(:message, ids) do
    from(m in Message, where: m.id in ^ids, select: {m.id, m.body})
    |> Repo.all()
    |> Enum.into(%{})
  end

  defp load_preloaded_resource(:goal_update, ids) do
    from(u in Update, where: u.id in ^ids, select: {u.id, u.message})
    |> Repo.all()
    |> Enum.into(%{})
  end

  defp load_preloaded_resource(:goal, ids) do
    from(g in Goal, where: g.id in ^ids, select: {g.id, g.description})
    |> Repo.all()
    |> Enum.into(%{})
  end

  defp load_preloaded_resource(:project_check_in, ids) do
    from(c in CheckIn, where: c.id in ^ids, select: {c.id, c.description})
    |> Repo.all()
    |> Enum.into(%{})
  end

  defp load_preloaded_resource(:project_retrospective, ids) do
    from(r in Retrospective, where: r.id in ^ids, select: {r.id, r.content})
    |> Repo.all()
    |> Enum.into(%{})
  end

  defp load_preloaded_resource(:resource_hub_document, ids) do
    from(d in Document, where: d.id in ^ids, select: {d.id, d.content})
    |> Repo.all()
    |> Enum.into(%{})
  end

  defp load_preloaded_resource(:comment_thread, ids) do
    from(t in CommentThread, where: t.id in ^ids, select: {t.id, t.message})
    |> Repo.all()
    |> Enum.into(%{})
  end

  defp load_preloaded_resource(resource, _ids) do
    raise "Missing preloaded resource loader for #{inspect(resource)} in direct mention classification"
  end

  defp rich_content_key(action) do
    Enum.find_value(@rich_content_actions, fn
      {^action, key} -> key
      _ -> nil
    end)
  end

  defp preloaded_content_spec(action) do
    Enum.find_value(@preloaded_content_actions, fn
      {^action, spec} -> spec
      _ -> nil
    end)
  end

  defp extract_resource_id(notification, %{resource_id: {:content, key}}), do: activity_content_value(notification, key)
  defp extract_resource_id(notification, %{resource_id: {:activity, key}}), do: activity_field_value(notification, key)

  defp action_for(activity), do: to_string(activity.action)

  defp lookup_preloaded_content(nil, _preloaded, _spec), do: nil

  defp lookup_preloaded_content(resource_id, preloaded, %{resource: resource}) do
    preloaded
    |> Map.get(resource, %{})
    |> Map.get(resource_id)
  end

  defp activity_content_value(notification, key) do
    case notification.activity do
      %{content: content} -> content_value(content, key)
      _ -> nil
    end
  end

  defp activity_field_value(notification, key) do
    case notification.activity do
      %{} = activity -> Map.get(activity, key)
      _ -> nil
    end
  end

  defp content_value(map, key) when is_map(map), do: Map.get(map, key)
  defp content_value(_map, _key), do: nil

  defp has_mention?(_content, nil), do: false

  defp has_mention?(content, person_id) do
    mentioned_ids = Operately.RichContent.find_mentioned_ids(content, :decode_ids)
    Enum.member?(mentioned_ids, person_id)
  rescue
    _ -> false
  end
end
