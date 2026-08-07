defmodule Operately.Projects.ProjectParticipation do
  @moduledoc """
  Shared helpers for adding people to a project: contributors, access bindings,
  task assignments, and subscriptions.
  """

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Notifications.Subscription
  alias Operately.Projects.Contributor
  alias Operately.Tasks.Assignee

  def upsert_contributor(repo, project, person_id, attrs \\ %{}) do
    attrs = Map.merge(attrs, %{project_id: project.id, person_id: person_id})

    case repo.get_by(Contributor, project_id: project.id, person_id: person_id) do
      nil -> repo.insert(Contributor.changeset(attrs))
      contributor when map_size(attrs) == 2 -> {:ok, contributor}
      contributor -> repo.update(Contributor.changeset(contributor, attrs))
    end
  end

  def ensure_access(repo, project, person_id, required_level, opts \\ []) do
    context = Access.get_context!(project_id: project.id)
    group = Access.get_group!(person_id: person_id)
    existing = Access.get_binding(context_id: context.id, group_id: group.id)

    attrs = %{
      context_id: context.id,
      group_id: group.id,
      access_level: max((existing && existing.access_level) || Binding.no_access(), required_level)
    }

    attrs = if tag = opts[:tag], do: Map.put(attrs, :tag, tag), else: attrs

    case repo.insert_or_update(Binding.changeset(existing || %Binding{}, attrs)) do
      {:ok, _binding} -> :ok
      {:error, changeset} -> {:error, {:invalid_person_binding, changeset}}
    end
  end

  def insert_assignment(repo, task, person_id) do
    case repo.get_by(Assignee, task_id: task.id, person_id: person_id) do
      nil -> repo.insert(Assignee.changeset(%{task_id: task.id, person_id: person_id}))
      assignee -> {:ok, assignee}
    end
  end

  def ensure_subscription(_repo, nil, _person_id, _type), do: :ok
  def ensure_subscription(_repo, _subscription_list_id, nil, _type), do: :ok

  def ensure_subscription(repo, subscription_list_id, person_id, type) do
    case repo.get_by(Subscription, subscription_list_id: subscription_list_id, person_id: person_id) do
      nil ->
        case repo.insert(Subscription.changeset(%{subscription_list_id: subscription_list_id, person_id: person_id, type: type})) do
          {:ok, _subscription} -> :ok
          {:error, changeset} -> {:error, {:subscription_failed, changeset}}
        end

      subscription ->
        case repo.update(Subscription.changeset(subscription, %{canceled: false})) do
          {:ok, _subscription} -> :ok
          {:error, changeset} -> {:error, {:subscription_failed, changeset}}
        end
    end
  end

  def ensure_assignee_contributor(repo, project, person_id) do
    with {:ok, contributor} <- find_or_create_assignee_contributor(repo, project, person_id),
         :ok <- ensure_access(repo, project, person_id, Binding.edit_access()),
         :ok <- ensure_subscription(repo, project.subscription_list_id, person_id, :invited) do
      {:ok, contributor}
    end
  end

  defp find_or_create_assignee_contributor(repo, project, person_id) do
    case repo.get_by(Contributor, project_id: project.id, person_id: person_id) do
      nil -> upsert_contributor(repo, project, person_id, %{responsibility: "contributor"})
      contributor -> {:ok, contributor}
    end
  end
end
