defmodule Operately.Operations.ProjectContributorsAddition do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Activities
  alias Operately.Notifications.Subscription
  alias Operately.Projects.Contributor

  def run(author, project, contributors) do
    Multi.new()
    |> add_contributors(project, contributors)
    |> insert_activity(author, project)
    |> Repo.transaction()
    |> case do
      {:ok, %{contributors: contribs}} -> {:ok, contribs}
      {:error, _step, reason, _} -> {:error, reason}
    end
  end

  def add_contributors(multi, project, contributors) do
    Multi.run(multi, :contributors, fn _, _ ->
      context = Access.get_context!(project_id: project.id)

      Enum.reduce_while(contributors, {:ok, []}, fn attrs, {:ok, acc} ->
        case add_contributor(project, context, attrs) do
          {:ok, contrib} -> {:cont, {:ok, [contrib | acc]}}
          {:error, _} = error -> {:halt, error}
        end
      end)
      |> case do
        {:ok, contribs} -> {:ok, Enum.reverse(contribs)}
        {:error, _} = error -> error
      end
    end)
  end

  defp add_contributor(project, access_context, attrs) do
    changeset = Contributor.changeset(%{
      project_id: project.id,
      person_id: attrs.person_id,
      role: attrs.role,
      responsibility: attrs[:responsibility],
    })

    case Operately.Repo.insert(changeset) do
      {:ok, contrib} ->
        {:ok, _} = Access.bind(access_context, person_id: attrs.person_id, level: attrs.access_level)
        {:ok, _} = ensure_subscription(project.subscription_list_id, attrs.person_id)
        {:ok, contrib}

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  defp insert_activity(multi, author, project) do
    Activities.insert_sync(multi, author.id, :project_contributors_addition, fn %{contributors: contributors} ->
      %{
        company_id: project.company_id,
        project_id: project.id,
        space_id: project.group_id,
        contributors: Enum.map(contributors, fn contributor ->
          %{
            person_id: contributor.person_id,
            contributor_id: contributor.id,
            responsibility: contributor.responsibility,
            role: Atom.to_string(contributor.role),
          }
        end)
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
