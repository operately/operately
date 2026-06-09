defmodule Operately.Operations.ProjectCheckIn do
  alias Ecto.Multi

  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Projects.{CheckIn, Project}
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  def run(author, project, attrs) do
    next_check_in =
      Operately.Time.calculate_next_weekly_check_in(
        project.next_check_in_scheduled_at,
        DateTime.utc_now()
      )

    Multi.new()
    |> SubscriptionList.insert(attrs)
    |> Subscription.insert(author, attrs)
    |> Multi.insert(:check_in, fn changes ->
      CheckIn.changeset(%{
        author_id: author.id,
        project_id: project.id,
        status: attrs.status,
        description: attrs.content,
        state: state(attrs),
        subscription_list_id: changes.subscription_list.id
      })
    end)
    |> SubscriptionList.update(:check_in)
    |> maybe_update_project(project, next_check_in, attrs)
    |> maybe_record_activity(author, project, attrs)
    |> Repo.transaction()
    |> Repo.extract_result(:check_in)
    |> case do
      {:ok, check_in} ->
        if check_in.state == :published do
          OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: author.id)
        end

        {:ok, check_in}

      error ->
        error
    end
  end

  defp maybe_update_project(multi, _project, _next_check_in, %{post_as_draft: true}), do: multi

  defp maybe_update_project(multi, project, next_check_in, _attrs) do
    Multi.update(multi, :project, fn changes ->
      Project.changeset(project, %{
        last_check_in_id: changes.check_in.id,
        last_check_in_status: changes.check_in.status,
        next_check_in_scheduled_at: next_check_in
      })
    end)
  end

  defp maybe_record_activity(multi, _author, _project, %{post_as_draft: true}), do: multi

  defp maybe_record_activity(multi, author, project, _attrs) do
    Activities.insert_sync(multi, author.id, :project_check_in_submitted, fn changes ->
      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: project.id,
        check_in_id: changes.check_in.id
      }
    end)
  end

  defp state(%{post_as_draft: true}), do: :draft
  defp state(_attrs), do: :published
end
