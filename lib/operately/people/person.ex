defmodule Operately.People.Person do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "people" do
    belongs_to(:account, Operately.People.Account)
    belongs_to(:company, Operately.Companies.Company)
    belongs_to(:home_dashboard, Operately.Dashboards.Dashboard)

    belongs_to(:manager, Operately.People.Person)
    has_many(:reports, Operately.People.Person, foreign_key: :manager_id)

    field :full_name, :string
    field :title, :string
    field :avatar_url, :string
    field :email, :string

    field :send_daily_summary, :boolean
    field :notify_on_mention, :boolean
    field :notify_about_assignments, :boolean

    field :theme, :string
    field :company_role, Ecto.Enum, values: [:admin, :member], default: :member

    field :suspended, :boolean, default: false
    field :suspended_at, :utc_datetime

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  @doc false
  def changeset(person, attrs) do
    person
    |> cast(attrs, [
      :full_name,
      :title,
      :avatar_url,
      :email,
      :account_id,
      :company_id,
      :manager_id,
      :home_dashboard_id,
      :send_daily_summary,
      :notify_on_mention,
      :notify_about_assignments,
      :company_role,
      :theme
    ])
    |> validate_required([:full_name, :company_id])
  end

  def short_name(person) do
    parts = String.split(person.full_name, " ")

    first_name = Enum.at(parts, 0)
    last_name = Enum.at(parts, -1)

    last_name_initial = String.first(last_name)

    "#{first_name} #{last_name_initial}."
  end

  def first_name(person) do
    [first_name | _] = String.split(person.full_name, " ")
    first_name
  end
end
