defmodule Operately.Data.Change080CreateSubscriptionsListForTasks do
  alias Operately.Repo
  alias __MODULE__.{Task, SubscriptionList}

  def run do
    Repo.transaction(fn ->
      Task
      |> Repo.all()
      |> create_subscriptions_list()
    end)
  end

  defp create_subscriptions_list(tasks) when is_list(tasks) do
    Enum.map(tasks, fn task ->
      create_subscriptions_list(task)
    end)
  end

  defp create_subscriptions_list(task) do
    case SubscriptionList.get(:system, parent_id: task.id) do
      {:error, :not_found} ->
        {:ok, subscriptions_list} = SubscriptionList.create(%{
          parent_id: task.id,
          parent_type: :project_task,
        })
        subscriptions_list

      {:ok, subscriptions_list} -> subscriptions_list
    end
    |> update_task(task)
  end

  defp update_task(subscriptions_list, task) do
    if subscriptions_list.id != task.subscription_list_id do
      {:ok, _} = Task.update(task, %{subscription_list_id: subscriptions_list.id})
    end
    subscriptions_list
  end

  defmodule Task do
    use Operately.Schema

    schema "tasks" do
      belongs_to :subscription_list, Operately.Notifications.SubscriptionList, foreign_key: :subscription_list_id

      timestamps()
    end

    def changeset(task, attrs) do
      task
      |> cast(attrs, [:subscription_list_id])
    end

    def update(task, attrs), do: changeset(task, attrs) |> Repo.update()
  end

  defmodule SubscriptionList do
    use Operately.Schema
    use Operately.Repo.Getter

    schema "subscription_lists" do
      field :parent_id, Ecto.UUID
      field :parent_type, Ecto.Enum, values: [:project_task]
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
