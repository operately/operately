defmodule Operately.Data.Change083CreateSubscriptionListsForMilestones do
  alias Operately.Repo
  alias __MODULE__.{Milestone, SubscriptionList}

  def run do
    Repo.transaction(fn ->
      Milestone
      |> Repo.all()
      |> Enum.each(&ensure_subscription_list/1)
    end)
  end

  defp ensure_subscription_list(milestone) do
    subscription_list =
      case SubscriptionList.get(:system, parent_id: milestone.id) do
        {:ok, subscription_list} -> subscription_list
        {:error, :not_found} ->
          {:ok, subscription_list} =
            SubscriptionList.create(%{
              parent_id: milestone.id,
              parent_type: :project_milestone
            })

          subscription_list
      end

    update_milestone(subscription_list, milestone)
  end

  defp update_milestone(subscription_list, milestone) do
    if subscription_list.id != milestone.subscription_list_id do
      {:ok, _} = Milestone.update(milestone, %{subscription_list_id: subscription_list.id})
    end

    subscription_list
  end

  defmodule Milestone do
    use Operately.Schema

    schema "project_milestones" do
      belongs_to :subscription_list, Operately.Notifications.SubscriptionList, foreign_key: :subscription_list_id

      timestamps()
    end

    def changeset(milestone, attrs) do
      milestone
      |> cast(attrs, [:subscription_list_id])
    end

    def update(milestone, attrs), do: changeset(milestone, attrs) |> Repo.update()
  end

  defmodule SubscriptionList do
    use Operately.Schema
    use Operately.Repo.Getter

    schema "subscription_lists" do
      field :parent_id, Ecto.UUID
      field :parent_type, Ecto.Enum, values: [:project_milestone]
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
