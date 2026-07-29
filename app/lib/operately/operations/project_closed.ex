defmodule Operately.Operations.ProjectClosed do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Projects.{Project, Retrospective}
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}
  alias Operately.Search.IndexUpdates
  alias Operately.Search.CoreWorkIndexUpdates

  def run(author, project, attrs) do
    Multi.new()
    |> SubscriptionList.insert(attrs)
    |> Subscription.insert(author, attrs)
    |> Multi.insert(:retrospective, fn changes ->
      Retrospective.changeset(%{
        author_id: author.id,
        project_id: project.id,
        content: attrs.content,
        subscription_list_id: changes.subscription_list.id,
      })
    end)
    |> SubscriptionList.update(:retrospective)
    |> Multi.update(:project, Project.changeset(project,%{
      status: "closed",
      closed_at: DateTime.utc_now(),
      success_status: attrs.success_status,
    }))
    |> Activities.insert_sync(author.id, :project_closed, fn changes -> %{
      company_id: project.company_id,
      space_id: project.group_id,
      project_id: project.id,
      retrospective_id: changes.retrospective.id,
    } end)
    |> IndexUpdates.enqueue(:search_project, "project", project.id)
    |> CoreWorkIndexUpdates.enqueue_project(project.id)
    |> Repo.transaction()
    |> Repo.extract_result(:retrospective)
  end
end
