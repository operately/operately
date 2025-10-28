defmodule Operately.Comments.CreateMilestoneCommentOperation do
  alias Operately.Repo
  alias Ecto.Multi

  alias Operately.Activities
  alias Operately.Comments.MilestoneComment
  alias Operately.Notifications.{Subscription, SubscriptionList}
  alias Operately.Operations.Notifications.Subscription, as: SubscriptionOperations
  alias Operately.Projects.Project
  alias Operately.Updates.Comment

  def run(author, milestone, action, comment_attrs) do
    Multi.new()
    |> Multi.insert(:comment, Comment.changeset(comment_attrs))
    |> maybe_track_mentions(milestone, action, comment_attrs)
    |> ensure_subscription_step(author, milestone, action)
    |> insert_milestone_comment(milestone, action)
    |> apply_comment_action(milestone, action)
    |> load_project(milestone)
    |> record_activity(author, milestone, action)
    |> Repo.transaction()
    |> broadcast_updates(action)
    |> Repo.extract_result(:result)
  end

  defp load_project(multi, milestone) do
    Multi.run(multi, :project, fn _, _ ->
      Project.get(:system, id: milestone.project_id, opts: [preload: [:champion]])
    end)
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
    |> SubscriptionOperations.update_mentioned_people(attrs.content["message"])
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
        changeset = Operately.Projects.Milestone.changeset(milestone, %{
          status: :done,
          completed_at: DateTime.utc_now()
        })

        Multi.update(multi, :milestone, changeset)

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
