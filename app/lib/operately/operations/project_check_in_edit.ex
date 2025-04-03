defmodule Operately.Operations.ProjectCheckInEdit do
  alias Ecto.Multi

  alias Operately.{Repo, Activities}
  alias Operately.Projects.Project
  alias Operately.Projects.CheckIn
  alias Operately.Notifications.SubscriptionList

  def run(author, check_in, status, description) do
    project = Operately.Projects.get_project!(check_in.project_id)

    Multi.new()
    |> Multi.update(:check_in, fn _ ->
      CheckIn.changeset(check_in, %{
        status: status,
        description: description
      })
    end)
    |> Multi.update(:project, fn _ ->
      Project.changeset(project, %{
        last_check_in_status: status,
      })
    end)
    |> Multi.run(:subscription_list, fn _, changes ->
      SubscriptionList.get(:system, parent_id: changes.check_in.id, opts: [
        preload: :subscriptions
      ])
    end)
    |> Operately.Operations.Notifications.Subscription.update_mentioned_people(description)
    |> Activities.insert_sync(author.id, :project_check_in_edit, fn changes -> %{
      company_id: project.company_id,
      project_id: changes.project.id,
      check_in_id: check_in.id
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:check_in)
  end
end
