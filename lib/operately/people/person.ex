defmodule Operately.People.Person do
  use Operately.Schema

  schema "people" do
    belongs_to(:account, Operately.People.Account)
    belongs_to(:company, Operately.Companies.Company)

    belongs_to(:manager, Operately.People.Person, foreign_key: :manager_id)
    has_many(:reports, Operately.People.Person, foreign_key: :manager_id)
    field :peers, :any, virtual: true # loaded in a custom preload

    has_one :access_group, Operately.Access.Group, foreign_key: :person_id
    has_one :access_context, through: [:company, :access_context]

    has_one :invitation, Operately.Invitations.Invitation, foreign_key: :member_id

    field :full_name, :string
    field :title, :string
    field :avatar_url, :string
    field :email, :string
    field :timezone, :string

    field :send_daily_summary, :boolean
    field :notify_on_mention, :boolean
    field :notify_about_assignments, :boolean

    field :theme, :string
    field :company_role, Ecto.Enum, values: [:admin, :member], default: :member

    field :suspended, :boolean, default: false
    field :suspended_at, :utc_datetime

    field :avatar_blob_id, :binary_id
    field :has_open_invitation, :boolean, default: false

    timestamps()
    requester_access_level()
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
      :timezone,
      :email,
      :account_id,
      :company_id,
      :manager_id,
      :send_daily_summary,
      :notify_on_mention,
      :notify_about_assignments,
      :company_role,
      :theme,
      :suspended,
      :suspended_at,
      :avatar_blob_id,
      :has_open_invitation
    ])
    |> validate_required([:full_name, :company_id])
    |> foreign_key_constraint(:avatar_blob_id, name: :people_avatar_blob_id_fkey)
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

  import Ecto.Query, only: [from: 2]

  #
  # Scope
  #
  def scope_company(query, company_id) do
    from p in query, where: p.company_id == ^company_id
  end

  #
  # Custom prealoads
  #

  def preload_peers(person) do
    peers = Operately.People.get_peers(person)
    Map.put(person, :peers, peers)
  end
end
