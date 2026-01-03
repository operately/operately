defmodule Operately.Operations.ProjectResuming do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Projects
  alias Operately.Activities
  alias Operately.Comments.CommentThread
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  def run(author, project, attrs) do
    changeset = Projects.Project.changeset(project, %{status: "active"})

    Multi.new()
    |> SubscriptionList.insert(attrs)
    |> Subscription.insert(author, attrs)
    |> Multi.update(:project, changeset)
    |> Activities.insert_sync(author.id, :project_resuming, fn _changes ->
      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: project.id,
      }
    end, include_notification: false)
    |> Multi.insert(:thread, fn changes -> CommentThread.changeset(%{
      parent_id: changes.activity.id,
      parent_type: "activity",
      message: attrs.content,
      subscription_list_id: changes.subscription_list.id
    }) end)
    |> Multi.update(:activity_with_thread, fn changes ->
      Activities.Activity.changeset(changes.activity, %{
        comment_thread_id: changes.thread.id
      })
    end)
    |> SubscriptionList.update(:thread)
    |> Activities.dispatch_notification()
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end
end
