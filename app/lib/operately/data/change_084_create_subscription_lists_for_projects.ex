defmodule Operately.Data.Change084CreateSubscriptionListsForProjects do
  alias Operately.Repo
  alias __MODULE__.{Project, SubscriptionList}

  def run do
    Repo.transaction(fn ->
      Project
      |> Repo.all(with_deleted: true)
      |> Enum.each(&ensure_subscription_list/1)
    end)
  end

  defp ensure_subscription_list(project) do
    subscription_list =
      case SubscriptionList.get(:system, parent_id: project.id) do
        {:ok, subscription_list} -> subscription_list
        {:error, :not_found} ->
          {:ok, subscription_list} =
            SubscriptionList.create(%{
              parent_id: project.id,
              parent_type: :project
            })

          subscription_list
      end

    update_project(subscription_list, project)
  end

  defp update_project(subscription_list, project) do
    if subscription_list.id != project.subscription_list_id do
      {:ok, _} = Project.update(project, %{subscription_list_id: subscription_list.id})
    end

    subscription_list
  end

  defmodule Project do
    use Operately.Schema

    schema "projects" do
      belongs_to :subscription_list, Operately.Notifications.SubscriptionList, foreign_key: :subscription_list_id

      soft_delete()
      timestamps()
    end

    def changeset(project, attrs) do
      project
      |> cast(attrs, [:subscription_list_id])
    end

    def update(project, attrs), do: changeset(project, attrs) |> Repo.update()
  end

  defmodule SubscriptionList do
    use Operately.Schema
    use Operately.Repo.Getter

    schema "subscription_lists" do
      field :parent_id, Ecto.UUID
      field :parent_type, Ecto.Enum, values: [:project]
      field :send_to_everyone, :boolean, default: false

      timestamps()
    end

    def changeset(attrs) do
      %__MODULE__{}
      |> cast(attrs, [:parent_id, :parent_type, :send_to_everyone])
    end

    def create(attrs), do: changeset(attrs) |> Repo.insert()
  end
end
