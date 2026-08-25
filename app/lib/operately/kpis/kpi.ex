defmodule Operately.Kpis.Kpi do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "kpis" do
    belongs_to(:space, Operately.Groups.Group, foreign_key: :space_id)
    belongs_to(:champion, Operately.People.Person, foreign_key: :champion_id)
    belongs_to(:subscription_list, Operately.Notifications.SubscriptionList, foreign_key: :subscription_list_id)

    has_one(:access_context, through: [:space, :access_context])
    has_many(:entries, Operately.Kpis.KpiEntry)
    has_many(:annotations, Operately.Kpis.KpiAnnotation)

    field(:name, :string)
    field(:unit, :string)
    field(:cadence, Ecto.Enum, values: [:weekly, :monthly])
    field(:description, :map)

    # Populated by Kpis.load_recent_entries/2, so any view that lists KPIs can
    # show the most recent value without preloading the full entry history.
    field(:latest_entry, :any, virtual: true)

    timestamps()
    request_info()
    requester_access_level()
  end

  def changeset(attrs = %{}) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(kpi, attrs) do
    kpi
    |> cast(attrs, [:space_id, :champion_id, :subscription_list_id, :name, :unit, :cadence, :description])
    |> validate_required([:space_id, :name, :unit, :cadence, :subscription_list_id])
  end
end
