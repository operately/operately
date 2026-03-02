defmodule Operately.Operations.ProjectDescriptionUpdating do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Projects.Project
  alias Operately.Operations.Notifications.Subscription

  def run(author, project, description) do
    Multi.new()
    |> Multi.update(:project, Project.changeset(project, %{description: description}))
    |> Multi.run(:subscription_list, fn _repo, _changes ->
      Operately.Notifications.SubscriptionList.get(:system, id: project.subscription_list_id, opts: [preload: :subscriptions])
    end)
    |> Subscription.update_mentioned_people(description)
    |> Activities.insert_sync(author.id, :project_description_changed, fn _ ->
      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: project.id,
        project_name: project.name,
        has_description: Operately.RichContent.empty?(description),
        description: description
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end
end
