defmodule Operately.Operations.ProjectCheckInEdit do
  alias Ecto.Multi

  alias Operately.{Repo, Activities}
  alias Operately.Projects.Project
  alias Operately.Projects.CheckIn
  alias Operately.Notifications.SubscriptionList

  def run(author, check_in, attrs) do
    project = Operately.Projects.get_project!(check_in.project_id)

    next_check_in =
      Operately.Time.calculate_next_weekly_check_in(
        project.next_check_in_scheduled_at,
        DateTime.utc_now()
      )

    Multi.new()
    |> Multi.update(:check_in, fn _ ->
      CheckIn.changeset(check_in, %{
        status: attrs.status,
        description: attrs.description,
        state: state(check_in, attrs)
      })
    end)
    |> maybe_update_project(project, check_in, attrs, next_check_in)
    |> Multi.run(:subscription_list, fn _, changes ->
      SubscriptionList.get(:system,
        parent_id: changes.check_in.id,
        opts: [
          preload: :subscriptions
        ]
      )
    end)
    |> Operately.Operations.Notifications.Subscription.update_mentioned_people(attrs.description)
    |> record_activity(author, project, check_in, attrs)
    |> Repo.transaction()
    |> Repo.extract_result(:check_in)
    |> broadcast_if_published(author)
  end

  defp maybe_update_project(multi, project, check_in, attrs, next_check_in) do
    Multi.update(multi, :project, fn changes ->
      cond do
        changes.check_in.state == :draft ->
          Project.changeset(project, %{})

        check_in.state == :draft ->
          Project.changeset(project, %{
            last_check_in_id: changes.check_in.id,
            last_check_in_status: changes.check_in.status,
            next_check_in_scheduled_at: next_check_in
          })

        true ->
          Project.changeset(project, %{
            last_check_in_status: attrs.status
          })
      end
    end)
  end

  defp record_activity(multi, author, project, %{state: :draft}, %{state: :published}) do
    Activities.insert_sync(multi, author.id, :project_check_in_submitted, fn changes ->
      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: project.id,
        check_in_id: changes.check_in.id
      }
    end)
  end

  defp record_activity(multi, _author, _project, %{state: :draft}, _attrs), do: multi

  defp record_activity(multi, author, project, _check_in, _attrs) do
    Activities.insert_sync(multi, author.id, :project_check_in_edit, fn changes ->
      %{
        company_id: project.company_id,
        project_id: changes.project.id,
        check_in_id: changes.check_in.id
      }
    end)
  end

  defp state(check_in, attrs), do: attrs[:state] || check_in.state

  defp broadcast_if_published({:ok, check_in}, author) do
    if check_in.state == :published do
      OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: author.id)
    end

    {:ok, check_in}
  end

  defp broadcast_if_published(error, _author), do: error
end
