defmodule Operately.Operations.ProjectCheckIn do
  alias Ecto.Multi

  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Projects.{CheckIn, Project}
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  def run(author, project, attrs) do
    next_check_in = Operately.Time.calculate_next_weekly_check_in(
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
        description: attrs.description,
        subscription_list_id: changes.subscription_list.id,
      })
    end)
    |> SubscriptionList.update()
    |> Multi.update(:project, fn changes ->
      Project.changeset(project, %{
        last_check_in_id: changes.check_in.id,
        last_check_in_status: changes.check_in.status,
        next_check_in_scheduled_at: next_check_in,
      })
    end)
    |> Activities.insert_sync(author.id, :project_check_in_submitted, fn changes ->
      %{
        company_id: project.company_id,
        project_id: project.id,
        check_in_id: changes.check_in.id
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:check_in)
    |> case do
      {:ok, check_in} ->
        OperatelyWeb.ApiSocket.broadcast!("api:assignments_count:#{author.id}")
        {:ok, check_in}

      error -> error
    end
  end
end
