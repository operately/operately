defmodule Operately.Comments.CreateMilestoneCommentOperation do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Ecto.Multi

  alias Operately.Activities
  alias Operately.Comments.MilestoneComment
  alias Operately.Notifications.{Subscription, SubscriptionList}
  alias Operately.Operations.Notifications.Subscription, as: SubscriptionOperations
  alias Operately.Projects.Project
  alias Operately.Search.IndexUpdates
  alias Operately.Tasks.{KanbanState, OrderingState, Task}
  alias Operately.Updates.Comment
  alias OperatelyWeb.Paths

  def run(author, milestone, action, comment_attrs) do
    run(author, milestone, action, nil, comment_attrs)
  end

  def run(author, milestone, action, open_tasks_resolution, comment_attrs) do
    Multi.new()
    |> Multi.insert(:comment, Comment.changeset(comment_attrs))
    |> maybe_track_mentions(milestone, action, comment_attrs)
    |> ensure_subscription_step(author, milestone, action)
    |> insert_milestone_comment(milestone, action)
    |> load_project(milestone)
    |> load_open_tasks(milestone, action)
    |> validate_open_tasks_resolution(action, open_tasks_resolution)
    |> resolve_open_tasks(action)
    |> apply_comment_action(milestone, action)
    |> maybe_update_project_kanban(action)
    |> maybe_enqueue_resolved_tasks(action)
    |> maybe_enqueue_milestone(action, milestone.id)
    |> record_activity(author, milestone, action)
    |> Repo.transaction()
    |> broadcast_updates(action)
    |> extract_result()
  end

  defp extract_result({:ok, changes}), do: {:ok, changes.result}
  defp extract_result({:error, _operation, {:bad_request, message}, _changes}), do: {:error, {:bad_request, message}}
  defp extract_result(error), do: error

  defp maybe_enqueue_milestone(multi, action, milestone_id) when action in ["complete", "reopen"] do
    IndexUpdates.enqueue(multi, :search_milestone, "milestone", milestone_id)
  end

  defp maybe_enqueue_milestone(multi, _action, _milestone_id), do: multi

  defp load_project(multi, milestone) do
    Multi.run(multi, :project, fn _, _ ->
      Project.get(:system, id: milestone.project_id, opts: [preload: [:champion]])
    end)
  end

  defp load_open_tasks(multi, _milestone, action) when action != "complete" do
    Multi.put(multi, :open_tasks, [])
  end

  defp load_open_tasks(multi, milestone, "complete") do
    Multi.run(multi, :open_tasks, fn repo, _changes ->
      tasks =
        from(t in Task,
          where: t.milestone_id == ^milestone.id,
          where: is_nil(t.closed_at),
          where: fragment("COALESCE((?->>'closed')::boolean, false) = false", t.task_status),
          lock: "FOR UPDATE"
        )
        |> repo.all()

      {:ok, tasks}
    end)
  end

  defp validate_open_tasks_resolution(multi, action, _resolution) when action != "complete" do
    Multi.put(multi, :open_tasks_resolution, nil)
  end

  defp validate_open_tasks_resolution(multi, "complete", resolution) do
    Multi.run(multi, :open_tasks_resolution, fn _repo, changes ->
      validate_resolution(changes.project, changes.open_tasks, resolution)
    end)
  end

  defp validate_resolution(_project, [], _resolution), do: {:ok, nil}

  defp validate_resolution(_project, _open_tasks, nil) do
    {:error, {:bad_request, "Choose what happens to the open tasks before completing the milestone"}}
  end

  defp validate_resolution(_project, _open_tasks, %{action: action}) when action in [:move_to_no_milestone, "move_to_no_milestone"] do
    {:ok, %{action: :move_to_no_milestone}}
  end

  defp validate_resolution(project, _open_tasks, %{action: action} = resolution) when action in [:set_status, "set_status"] do
    status = Enum.find(project.task_statuses || [], &(&1.id == resolution[:status_id]))

    if status && status.closed do
      {:ok, %{action: :set_status, status: status}}
    else
      {:error, {:bad_request, "Select a closed task status"}}
    end
  end

  defp validate_resolution(_project, _open_tasks, _resolution) do
    {:error, {:bad_request, "Choose a valid open task resolution"}}
  end

  defp resolve_open_tasks(multi, action) when action != "complete" do
    Multi.put(multi, :resolved_open_tasks, [])
  end

  defp resolve_open_tasks(multi, "complete") do
    Multi.run(multi, :resolved_open_tasks, fn repo, changes ->
      changes.open_tasks
      |> Enum.reduce_while({:ok, []}, fn task, {:ok, updated_tasks} ->
        attrs = open_task_resolution_attrs(task, changes.open_tasks_resolution)

        case task |> Task.changeset(attrs) |> repo.update() do
          {:ok, updated_task} -> {:cont, {:ok, [updated_task | updated_tasks]}}
          {:error, changeset} -> {:halt, {:error, changeset}}
        end
      end)
      |> then(fn
        {:ok, updated_tasks} -> {:ok, Enum.reverse(updated_tasks)}
        error -> error
      end)
    end)
  end

  defp open_task_resolution_attrs(_task, %{action: :move_to_no_milestone}) do
    %{milestone_id: nil}
  end

  defp open_task_resolution_attrs(_task, %{action: :set_status, status: status}) do
    %{task_status: Map.from_struct(status)}
  end

  defp maybe_track_mentions(multi, _milestone, action, _attrs) when action in ["complete", "reopen"],
    do: multi

  defp maybe_track_mentions(multi, milestone, _action, attrs) do
    multi
    |> Multi.run(:subscription_list, fn _, _ ->
      SubscriptionList.get(:system, id: milestone.subscription_list_id, opts: [
        preload: :subscriptions
      ])
    end)
    |> SubscriptionOperations.update_mentioned_people(attrs.content)
  end

  defp ensure_subscription_step(multi, _author, _milestone, action) when action in ["complete", "reopen"],
    do: multi

  defp ensure_subscription_step(multi, author, milestone, _action) do
    Multi.run(multi, :comment_author_subscription, fn _, changes ->
      subscription_list =
        case Map.fetch(changes, :subscription_list) do
          {:ok, nil} -> {:error, :not_found}
          {:ok, list} -> {:ok, list}
          :error -> SubscriptionList.get(:system, id: milestone.subscription_list_id)
        end

      case subscription_list do
        {:ok, list} -> ensure_subscription(list.id, author.id)
        {:error, :not_found} -> {:ok, nil}
      end
    end)
  end

  defp insert_milestone_comment(multi, milestone, action) do
    multi
    |> Multi.insert(:milestone_comment, fn changes ->
      MilestoneComment.changeset(%{
        milestone_id: milestone.id,
        comment_id: changes[:comment].id,
        action: action
      })
    end)
    |> Multi.run(:result, fn _, changes ->
      comment = Map.put(changes.milestone_comment, :comment, changes.comment)
      {:ok, comment}
    end)
  end

  defp apply_comment_action(multi, milestone, action) do
    case action do
      "complete" ->
        Multi.update(multi, :milestone, fn changes ->
          task_ids = Enum.map(changes.open_tasks, &Paths.task_id/1)
          status_values = Project.task_status_values(changes.project)

          Operately.Projects.Milestone.changeset(milestone, %{
            status: :done,
            completed_at: milestone.completed_at || NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second),
            tasks_ordering_state: remove_task_ids_from_ordering(milestone.tasks_ordering_state, task_ids),
            tasks_kanban_state:
              resolve_kanban_state(
                milestone.tasks_kanban_state,
                status_values,
                task_ids,
                changes.open_tasks_resolution
              )
          })
        end)

      "reopen" ->
        changeset = Operately.Projects.Milestone.changeset(milestone, %{
          status: :pending,
          completed_at: nil
        })

        Multi.update(multi, :milestone, changeset)

      _ ->
        multi
    end
  end

  defp maybe_update_project_kanban(multi, action) when action != "complete", do: multi

  defp maybe_update_project_kanban(multi, "complete") do
    Multi.run(multi, :updated_project_task_state, fn repo, changes ->
      resolution = changes.open_tasks_resolution

      if resolution && resolution.action == :set_status && changes.open_tasks != [] do
        task_ids = Enum.map(changes.open_tasks, &Paths.task_id/1)
        status_values = Project.task_status_values(changes.project)
        kanban_state = resolve_kanban_state(changes.project.tasks_kanban_state, status_values, task_ids, resolution)

        changes.project
        |> Project.changeset(%{tasks_kanban_state: kanban_state})
        |> repo.update()
      else
        {:ok, changes.project}
      end
    end)
  end

  defp maybe_enqueue_resolved_tasks(multi, action) when action != "complete", do: multi

  defp maybe_enqueue_resolved_tasks(multi, "complete") do
    IndexUpdates.enqueue(multi, :search_resolved_tasks, "task", fn changes ->
      Enum.map(changes.resolved_open_tasks, & &1.id)
    end)
  end

  defp remove_task_ids_from_ordering(ordering_state, []), do: ordering_state

  defp remove_task_ids_from_ordering(ordering_state, task_ids) do
    ordering_state
    |> OrderingState.load()
    |> Enum.reject(&(&1 in task_ids))
  end

  defp resolve_kanban_state(kanban_state, _status_values, [], _resolution), do: kanban_state

  defp resolve_kanban_state(kanban_state, status_values, task_ids, resolution) do
    next_state =
      kanban_state
      |> KanbanState.load(status_values)
      |> Enum.into(%{}, fn {status, ids} -> {status, Enum.reject(ids, &(&1 in task_ids))} end)

    case resolution do
      %{action: :set_status, status: status} ->
        status_value = to_string(status.value || status.id)
        Map.update(next_state, status_value, task_ids, &Enum.uniq(&1 ++ task_ids))

      _ ->
        next_state
    end
  end

  defp record_activity(multi, author, milestone, action) do
    Activities.insert_sync(multi, author.id, :project_milestone_commented, fn changes ->
      %{
        company_id: changes.project.company_id,
        space_id: changes.project.group_id,
        project_id: changes.project.id,
        milestone_id: milestone.id,
        comment_id: changes.comment.id,
        comment_action: action
      }
    end)
  end

  defp broadcast_updates(result, action) do
    case result do
      {:ok, changes} ->
        if action in ["complete", "reopen"] and changes.project.champion do
          OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: changes.project.champion.id)
        end

        if action not in ["complete", "reopen"] and changes.result do
          OperatelyWeb.ApiSocket.broadcast!("api:reload_comments:#{changes.result.milestone_id}")
        end

      _ ->
        :ok
    end

    result
  end

  defp ensure_subscription(nil, _person_id), do: {:ok, nil}

  defp ensure_subscription(subscription_list_id, person_id) do
    case Subscription.get(:system, subscription_list_id: subscription_list_id, person_id: person_id) do
      {:error, :not_found} ->
        Operately.Notifications.create_subscription(%{
          subscription_list_id: subscription_list_id,
          person_id: person_id,
          type: :joined
        })

      {:ok, subscription} ->
        Operately.Notifications.update_subscription(subscription, %{canceled: false})
    end
  end
end
