defmodule Operately.Operations.ProjectClosed do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Projects.{Project, Retrospective}
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  def run(author, project, attrs) do
    Multi.new()
    |> SubscriptionList.insert(attrs)
    |> Subscription.insert(author, attrs)
    |> Multi.insert(:retrospective, fn changes ->
      Retrospective.changeset(%{
        author_id: author.id,
        project_id: project.id,
        content: attrs.retrospective,
        closed_at: DateTime.utc_now(),
        subscription_list_id: changes.subscription_list.id,
      })
    end)
    |> SubscriptionList.update(:retrospective)
    |> Multi.update(:project, fn changes ->
      Project.changeset(project,%{
        status: "closed",
        closed_at: changes.retrospective.closed_at,
      })
    end)
    |> Activities.insert_sync(author.id, :project_closed, fn _changes -> %{
      company_id: project.company_id,
      project_id: project.id
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:retrospective)
  end
end
