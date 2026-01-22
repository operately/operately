defmodule Operately.People.Person do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "people" do
    belongs_to(:account, Operately.People.Account)
    belongs_to(:company, Operately.Companies.Company)

    belongs_to(:manager, Operately.People.Person, foreign_key: :manager_id)
    has_many(:reports, Operately.People.Person, foreign_key: :manager_id)
    has_one(:agent_def, Operately.People.AgentDef, foreign_key: :person_id)

    has_one(:access_group, Operately.Access.Group, foreign_key: :person_id)
    has_one(:access_context, through: [:company, :access_context])
    has_many(:access_group_memberships, Operately.Access.GroupMembership, foreign_key: :person_id)

    has_one(:invite_link, Operately.InviteLinks.InviteLink, foreign_key: :person_id)

    field :full_name, :string
    field :title, :string
    field :avatar_url, :string
    field :email, :string
    field :timezone, :string
    field :description, :map

    field :send_daily_summary, :boolean
    field :notify_on_mention, :boolean
    field :notify_about_assignments, :boolean, default: true

    field :suspended, :boolean, default: false
    field :suspended_at, :utc_datetime

    field :avatar_blob_id, :binary_id
    field :type, Ecto.Enum, values: [:human, :guest, :ai], default: :human

    # loaded via hooks
    field :access_level, :any, virtual: true
    field :permissions, :any, virtual: true
    field :peers, :any, virtual: true

    timestamps()
    request_info()
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
      :description,
      :send_daily_summary,
      :notify_on_mention,
      :notify_about_assignments,
      :suspended,
      :suspended_at,
      :avatar_blob_id,
      :type
    ])
    |> validate_required([:full_name, :company_id])
    |> foreign_key_constraint(:avatar_blob_id, name: :people_avatar_blob_id_fkey)
    |> unique_constraint([:company_id, :account_id], name: :people_company_id_account_id_index, message: "Email has already been taken")
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

  def get_by!(:system, field_values) do
    Operately.Repo.get_by!(__MODULE__, field_values)
  end

  def load_permissions(person = %__MODULE__{}) do
    perms = Operately.People.Permissions.calculate(person.request_info.access_level)
    Map.put(person, :permissions, perms)
  end
end
