defmodule Operately.Data.Change113CreateSubscriptionListsForKpis do
  alias Operately.Repo
  alias __MODULE__.{Kpi, Subscription, SubscriptionList}

  def run do
    Repo.transaction(fn ->
      Kpi
      |> Repo.all()
      |> Enum.each(&ensure_subscription_list/1)
    end)
  end

  defp ensure_subscription_list(kpi) do
    subscription_list =
      case SubscriptionList.get(:system, parent_id: kpi.id) do
        {:ok, subscription_list} ->
          subscription_list

        {:error, :not_found} ->
          {:ok, subscription_list} =
            SubscriptionList.create(%{
              parent_id: kpi.id,
              parent_type: :kpi
            })

          subscription_list
      end

    update_kpi(subscription_list, kpi)
    subscribe_champion(subscription_list, kpi)
  end

  defp update_kpi(subscription_list, kpi) do
    if subscription_list.id != kpi.subscription_list_id do
      {:ok, _} = Kpi.update(kpi, %{subscription_list_id: subscription_list.id})
    end

    subscription_list
  end

  defp subscribe_champion(_subscription_list, %{champion_id: nil}), do: :ok

  defp subscribe_champion(subscription_list, kpi) do
    case Subscription.get(:system, subscription_list_id: subscription_list.id, person_id: kpi.champion_id) do
      {:ok, _} ->
        :ok

      {:error, :not_found} ->
        {:ok, _} =
          Subscription.create(%{
            subscription_list_id: subscription_list.id,
            person_id: kpi.champion_id,
            type: :invited
          })

        :ok
    end
  end

  defmodule Kpi do
    use Operately.Schema

    schema "kpis" do
      belongs_to :subscription_list, Operately.Notifications.SubscriptionList, foreign_key: :subscription_list_id
      field :champion_id, Ecto.UUID

      timestamps()
    end

    def changeset(kpi, attrs) do
      kpi
      |> cast(attrs, [:subscription_list_id])
    end

    def update(kpi, attrs), do: changeset(kpi, attrs) |> Repo.update()
  end

  defmodule SubscriptionList do
    use Operately.Schema
    use Operately.Repo.Getter

    schema "subscription_lists" do
      field :parent_id, Ecto.UUID
      field :parent_type, Ecto.Enum, values: [:kpi]
      field :send_to_everyone, :boolean, default: false

      timestamps()
    end

    def changeset(attrs) do
      %__MODULE__{}
      |> cast(attrs, [:parent_id, :parent_type, :send_to_everyone])
    end

    def create(attrs), do: changeset(attrs) |> Repo.insert()
  end

  defmodule Subscription do
    use Operately.Schema
    use Operately.Repo.Getter

    schema "subscriptions" do
      field :subscription_list_id, Ecto.UUID
      field :person_id, Ecto.UUID
      field :type, Ecto.Enum, values: [:invited, :joined, :mentioned]
      field :canceled, :boolean, default: false

      timestamps()
      request_info()
    end

    def changeset(attrs) do
      %__MODULE__{}
      |> cast(attrs, [:subscription_list_id, :person_id, :type, :canceled])
    end

    def create(attrs), do: changeset(attrs) |> Repo.insert()
  end
end
