defmodule Operately.Companies.Company do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "companies" do
    has_one :access_context, Operately.Access.Context, foreign_key: :company_id
    has_many :access_groups, Operately.Access.Group, foreign_key: :company_id

    has_many :goals, Operately.Goals.Goal, foreign_key: :company_id
    has_many :people, Operately.People.Person, foreign_key: :company_id, where: [suspended_at: nil]
    has_many :spaces, Operately.Groups.Group, foreign_key: :company_id
    has_many :projects, Operately.Projects.Project, foreign_key: :company_id

    field :mission, :string
    field :name, :string
    field :trusted_email_domains, {:array, :string}
    field :enabled_experimental_features, {:array, :string}, default: []
    field :company_space_id, :binary_id
    field :short_id, :integer

    # loaded with hooks
    field :member_count, :integer, virtual: true
    field :admins, :any, virtual: true
    field :owners, :any, virtual: true
    field :permissions, :any, virtual: true

    field :people_count, :integer, virtual: true
    field :goals_count, :integer, virtual: true
    field :spaces_count, :integer, virtual: true
    field :projects_count, :integer, virtual: true
    field :last_activity_at, :utc_datetime, virtual: true

    timestamps()
    request_info()
    requester_access_level()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  @doc false
  def changeset(company, attrs) do
    company
    |> cast(attrs, [:name, :mission, :trusted_email_domains, :enabled_experimental_features, :company_space_id, :short_id])
    |> validate_required([:name])
    |> validate_length(:name, min: 3)
  end

  #
  # After load actions
  #

  import Ecto.Query, only: [from: 2]

  def load_member_count(companies) when is_list(companies) do
    ids = Enum.map(companies, fn c -> c.id end)

    query = from c in __MODULE__,
      join: p in assoc(c, :people),
      group_by: c.id,
      where: c.id in ^ids,
      select: {c.id, count(p.id)}

    member_counts = Operately.Repo.all(query)

    Enum.map(companies, fn company ->
      case Enum.find(member_counts, fn {id, _} -> id == company.id end) do
        {_, count} -> Map.put(company, :member_count, count)
        nil -> Map.put(company, :member_count, 0)
      end
    end)
  end

  def load_people(company) do
    company |> Repo.preload([:people])
  end

  def load_admins(company) do
    context = Operately.Access.get_context(company_id: company.id)
    people = Operately.Access.BindedPeopleLoader.load(context.id, :edit_access)
    Map.put(company, :admins, people)
  end

  def load_owners(companies) when is_list(companies) do
    ids = Enum.map(companies, fn c -> c.id end)

    query = from c in __MODULE__,
      join: p in assoc(c, :people),
      join: m in assoc(p, :access_group_memberships),
      join: g in assoc(m, :group),
      join: b in assoc(g, :bindings),
      join: ctx in assoc(b, :context),
      where: c.id in ^ids and ctx.company_id == c.id and b.access_level == ^Operately.Access.Binding.full_access(),
      select: {c.id, p}

    results = Operately.Repo.all(query)

    Enum.map(companies, fn company ->
      owners = Enum.filter(results, fn {id, _} -> id == company.id end) |> Enum.map(fn {_, p} -> p end)
      Map.put(company, :owners, owners)
    end)
  end

  def load_owners(company) do
    context = Operately.Access.get_context(company_id: company.id)
    people = Operately.Access.BindedPeopleLoader.load(context.id, :full_access)
    Map.put(company, :owners, people)
  end

  def load_permissions(company) do
    permissions = Operately.Companies.Permissions.calculate(company.request_info.access_level)
    Map.put(company, :permissions, permissions)
  end

  def load_people_count(companies) when is_list(companies) do
    query = from(c in __MODULE__, 
      join: p in assoc(c, :people),
      where: c.id in ^ids(companies),
      group_by: c.id, 
      select: {c.id, count(p.id)}
    )

    load_aggregate(companies, query, :people_count)
  end

  def load_people_count(company) do
    [company] |> load_people_count() |> hd()
  end

  def load_goals_count(companies) when is_list(companies) do
    query = from(c in __MODULE__, 
      join: g in assoc(c, :goals), 
      where: c.id in ^ids(companies),
      group_by: c.id, 
      select: {c.id, count(g.id)}
    )

    load_aggregate(companies, query, :goals_count)
  end

  def load_goals_count(company) do
    [company] |> load_goals_count() |> hd()
  end

  def load_spaces_count(companies) when is_list(companies) do
    query = from(c in __MODULE__, 
      join: s in assoc(c, :spaces), 
      where: c.id in ^ids(companies),
      group_by: c.id, 
      select: {c.id, count(s.id)}
    )

    load_aggregate(companies, query, :spaces_count)
  end

  def load_spaces_count(company) do
    [company] |> load_spaces_count() |> hd()
  end

  def load_projects_count(companies) when is_list(companies) do
    query = from(c in __MODULE__, 
      join: p in assoc(c, :projects), 
      where: c.id in ^ids(companies),
      group_by: c.id, 
      select: {c.id, count(p.id)}
    )

    load_aggregate(companies, query, :projects_count)
  end

  def load_projects_count(company) do
    [company] |> load_projects_count() |> hd()
  end

  def load_last_activity_event(companies) when is_list(companies) do
    ids = Enum.map(companies, fn c -> to_string(c.id) end)

    query = from a in Operately.Activities.Activity,
      where: fragment("(?->>?)", a.content, "company_id") in ^ids,
      group_by: fragment("?->> ?", a.content, "company_id"),
      select: {fragment("?->>?", a.content, "company_id"), max(a.inserted_at)}

    load_aggregate(companies, query, :last_activity_at, nil)
  end

  def load_last_activity_event(company) do
    [company] |> load_last_activity_event() |> hd()
  end

  defp load_aggregate(companies, query, key, default \\ 0) do
    results = Operately.Repo.all(query)
    
    Enum.map(companies, fn company ->
      case Enum.find(results, fn {id, _} -> id == company.id end) do
        {_, count} -> Map.put(company, key, count)
        nil -> Map.put(company, key, default)
      end
    end)
  end

  defp ids(companies) do
    Enum.map(companies, fn c -> c.id end)
  end

end
