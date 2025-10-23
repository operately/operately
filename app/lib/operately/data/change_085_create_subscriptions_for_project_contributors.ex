defmodule Operately.Data.Change085CreateSubscriptionsForProjectContributors do
  alias Operately.Repo
  alias __MODULE__.{Project, Contributor, Subscription, Person, SubscriptionList}

  def run do
    Repo.transaction(fn ->
      Project
      |> Repo.all(with_deleted: true)
      |> Repo.preload(:contributors)
      |> Enum.each(&ensure_contributors_subscriptions/1)
    end)
  end

  defp ensure_contributors_subscriptions(project) do
    Enum.each(project.contributors, fn contributor ->
      ensure_subscription(project.subscription_list_id, contributor.person_id)
    end)
  end

  defp ensure_subscription(nil, _person_id), do: :ok

  defp ensure_subscription(subscription_list_id, person_id) do
    case Subscription.get(:system, subscription_list_id: subscription_list_id, person_id: person_id) do
      {:error, :not_found} ->
        {:ok, _} = Subscription.create(%{
          subscription_list_id: subscription_list_id,
          person_id: person_id,
          type: :invited
        })

      {:ok, _} ->
        :ok
    end
  end

  defmodule Project do
    use Operately.Schema

    schema "projects" do
      belongs_to :subscription_list, SubscriptionList, foreign_key: :subscription_list_id
      has_many :contributors, Contributor, foreign_key: :project_id

      soft_delete()
      timestamps()
    end
  end

  defmodule Contributor do
    use Operately.Schema

    schema "project_contributors" do
      belongs_to :project, Project, foreign_key: :project_id
      belongs_to :person, Person, foreign_key: :person_id

      timestamps()
    end
  end

  defmodule Person do
    use Operately.Schema

    schema "people" do
      timestamps()
    end
  end

  defmodule SubscriptionList do
    use Operately.Schema

    schema "subscription_lists" do
      timestamps()
    end
  end

  defmodule Subscription do
    use Operately.Schema
    use Operately.Repo.Getter

    schema "subscriptions" do
      belongs_to :subscription_list, SubscriptionList, foreign_key: :subscription_list_id
      belongs_to :person, Person, foreign_key: :person_id

      field :type, Ecto.Enum, values: [:invited, :joined, :mentioned]
      field :canceled, :boolean, default: false

      timestamps()
    end

    def changeset(attrs) do
      changeset(%__MODULE__{}, attrs)
    end

    def changeset(subscription, attrs) do
      subscription
      |> Ecto.Changeset.cast(attrs, [:type, :subscription_list_id, :person_id, :canceled])
    end

    def create(attrs), do: changeset(attrs) |> Repo.insert()
  end
end
