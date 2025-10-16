defmodule Operately.Operations.ProjectRetrospectiveEditing do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Projects.{Project, Retrospective}
  alias Operately.Notifications.SubscriptionList

  def run(author, retrospective, attrs) do
    if has_changed?(retrospective, attrs) do
      execute(author, retrospective, attrs)
    else
      {:ok, retrospective}
    end
  end

  defp execute(author, retrospective, attrs) do
    Multi.new()
    |> Multi.update(
      :retrospective,
      Retrospective.changeset(retrospective, %{
        content: attrs.content
      })
    )
    |> Multi.update(
      :project,
      Project.changeset(retrospective.project, %{
        success_status: attrs.success_status
      })
    )
    |> Multi.run(:retrospective_with_project, fn _, changes ->
      {:ok, Map.put(changes.retrospective, :project, changes.project)}
    end)
    |> update_subscriptions(attrs.content)
    |> Activities.insert_sync(author.id, :project_retrospective_edited, fn _ ->
      %{
        company_id: author.company_id,
        space_id: retrospective.project.group_id,
        project_id: retrospective.project_id,
        retrospective_id: retrospective.id
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:retrospective_with_project)
  end

  defp update_subscriptions(multi, content) do
    multi
    |> Multi.run(:subscription_list, fn _, changes ->
      SubscriptionList.get(:system,
        parent_id: changes.retrospective.id,
        opts: [
          preload: :subscriptions
        ]
      )
    end)
    |> Operately.Operations.Notifications.Subscription.update_mentioned_people(content)
  end

  #
  # Helpers
  #

  defp has_changed?(retrospective, attrs) do
    attrs.success_status != retrospective.project.success_status or retrospective.content != attrs.content
  end
end
