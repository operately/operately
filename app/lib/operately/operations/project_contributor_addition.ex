defmodule Operately.Operations.ProjectContributorAddition do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Activities
  alias Operately.Notifications.Subscription
  alias Operately.Projects.{Project, Contributor}

  def run(author, attrs) do
    Multi.new()
    |> Multi.insert(:contributor, Contributor.changeset(attrs))
    |> Multi.run(:project, fn _, _ -> Project.get(:system, id: attrs.project_id) end)
    |> insert_binding(attrs)
    |> ensure_subscription_step()
    |> insert_activity(author)
    |> Repo.transaction()
    |> Repo.extract_result(:contributor)
  end

  defp insert_binding(multi, attrs) do
    access_group = Access.get_group!(person_id: attrs.person_id)

    Multi.run(multi, :context, fn _, _ ->
      context = Access.get_context!(project_id: attrs.project_id)
      {:ok, context}
    end)
    |> Access.insert_binding(:contributor_binding, access_group, attrs.permissions)
  end

  defp ensure_subscription_step(multi) do
    Multi.run(multi, :subscription, fn _repo, %{project: project, contributor: contributor} ->
      ensure_subscription(project.subscription_list_id, contributor.person_id)
    end)
  end

  defp insert_activity(multi, author) do
    Activities.insert_sync(multi, author.id, :project_contributor_addition, fn %{project: project, contributor: contributor} ->
      %{
        company_id: author.company_id,
        project_id: contributor.project_id,
        space_id: project.group_id,
        person_id: contributor.person_id,
        contributor_id: contributor.id,
        responsibility: contributor.responsibility,
        role: Atom.to_string(contributor.role)
      }
    end)
  end

  defp ensure_subscription(nil, _person_id), do: {:ok, nil}

  defp ensure_subscription(subscription_list_id, person_id) do
    case Subscription.get(:system, subscription_list_id: subscription_list_id, person_id: person_id) do
      {:error, :not_found} ->
        Operately.Notifications.create_subscription(%{
          subscription_list_id: subscription_list_id,
          person_id: person_id,
          type: :invited
        })

      {:ok, subscription} ->
        Operately.Notifications.update_subscription(subscription, %{canceled: false})
    end
  end
end
