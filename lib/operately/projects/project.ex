defmodule Operately.Projects.Project do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Access.AccessLevels
  alias Operately.Projects.{Contributor, Permissions}

  schema "projects" do
    belongs_to :company, Operately.Companies.Company, foreign_key: :company_id
    belongs_to :creator, Operately.People.Person, foreign_key: :creator_id
    belongs_to :group, Operately.Groups.Group, foreign_key: :group_id
    belongs_to :goal, Operately.Goals.Goal, foreign_key: :goal_id

    has_many :contributors, Operately.Projects.Contributor, foreign_key: :project_id
    has_many :key_resources, Operately.Projects.KeyResource, foreign_key: :project_id
    has_many :milestones, Operately.Projects.Milestone, foreign_key: :project_id
    has_many :check_ins, Operately.Projects.CheckIn, foreign_key: :project_id

    has_one :champion_contributor, Contributor, foreign_key: :project_id, where: [role: "champion"]
    has_one :reviewer_contributor, Contributor, foreign_key: :project_id, where: [role: "reviewer"]

    has_one :access_context, Operately.Access.Context, foreign_key: :project_id
    has_one :champion, through: [:champion_contributor, :person]
    has_one :reviewer, through: [:reviewer_contributor, :person]

    field :description, :map
    field :name, :string
    field :private, :boolean, default: false

    field :started_at, :utc_datetime
    field :deadline, :utc_datetime

    belongs_to :last_check_in, Operately.Projects.CheckIn, foreign_key: :last_check_in_id
    field :last_check_in_status, :string
    field :next_check_in_scheduled_at, :utc_datetime

    field :health, Ecto.Enum, values: [:on_track, :at_risk, :off_track, :paused, :unknown], default: :on_track
    field :next_update_scheduled_at, :utc_datetime # Deprecated, use next_check_in_scheduled_at instead

    has_one :retrospective, Operately.Projects.Retrospective, foreign_key: :project_id
    field :status, :string, default: "active"
    field :closed_at, :utc_datetime

    # populated with after load hooks
    field :next_milestone, :any, virtual: true
    field :permissions, :any, virtual: true
    field :access_levels, :any, virtual: true
    field :privacy, :any, virtual: true
    field :potential_subscribers, :any, virtual: true

    timestamps()
    soft_delete()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(project, attrs) do
    project
    |> cast(attrs, [
      :name,
      :description,
      :group_id,
      :started_at,
      :deadline,
      :goal_id,
      :next_check_in_scheduled_at,
      :health,
      :company_id,
      :creator_id,
      :private,
      :deleted_at,
      :status,
      :last_check_in_id,
      :last_check_in_status,
      :next_update_scheduled_at,
    ])
    |> validate_required([
      :name,
      :company_id,
      :group_id,
      :creator_id,
    ])
  end

  # Scopes

  import Ecto.Query, only: [from: 2]

  def scope_company(query, company_id) do
    from p in query, where: p.company_id == ^company_id
  end

  def scope_visibility(query, person_id) do
    alias Operately.Projects.Contributor

    sub = from c in Contributor,
       where: c.project_id == parent_as(:project).id,
       where: c.person_id == ^person_id

    from p in query, where: not(p.private) or exists(sub)
  end

  def scope_role(query, person_id, roles) do
    alias Operately.Projects.Contributor

    sub = from c in Contributor,
      where: c.project_id == parent_as(:project).id,
      where: c.person_id == ^person_id,
      where: c.role in ^roles

    from p in query, where: exists(sub)
  end

  def scope_space(query, nil), do: query
  def scope_space(query, space_id) do
    from p in query, where: p.group_id == ^space_id
  end

  def scope_goal(query, nil), do: query
  def scope_goal(query, goal_id) do
    from p in query, where: p.goal_id == ^goal_id
  end

  # Queries

  def order_by_name(query) do
    from p in query, order_by: [asc: p.name]
  end


  # After load hooks

  def after_load_hooks(projects) when is_list(projects) do
    Enum.map(projects, fn project -> after_load_hooks(project) end)
  end

  def after_load_hooks(nil), do: nil
  def after_load_hooks(project = %__MODULE__{}) do
    project
    |> set_next_milestone()
  end

  defp set_next_milestone(project = %__MODULE__{}) do
    case project.milestones do
      [] -> project
      %Ecto.Association.NotLoaded{} -> project

      milestones ->
        next =
          milestones
          |> Enum.filter(fn milestone -> milestone.status == :pending end)
          |> Enum.sort_by(fn milestone -> milestone.deadline_at end)
          |> List.first()

        Map.put(project, :next_milestone, next)
    end
  end

  def load_contributor_access_levels(project) do
    contribs = Contributor.load_project_access_levels(project.contributors)
    Map.put(project, :contributors, contribs)
  end

  def set_permissions(project = %__MODULE__{}) do
    perms = Permissions.calculate(project.request_info.access_level)
    Map.put(project, :permissions, perms)
  end

  def set_potential_subscribers(project = %__MODULE__{}) do
    subscribers = Operately.Notifications.Subscriber.from_project_contributor(project.contributors)
    Map.put(project, :potential_subscribers, subscribers)
  end

  def load_access_levels(project) do
    context = Operately.Access.get_context!(project_id: project.id)
    access_levels = AccessLevels.load(context.id, project.company_id, project.group_id)

    Map.put(project, :access_levels, access_levels)
  end

  def load_privacy(projects) when is_list(projects) do
    Enum.map(projects, &load_privacy/1)
  end

  def load_privacy(project) do
    project = if project.access_levels, do: project, else: load_access_levels(project)
    Map.put(project, :privacy, AccessLevels.calc_privacy(project.access_levels))
  end

  def get_access_context(project = %__MODULE__{}) do
    get_access_context(project.id)
  end

  def get_access_context(project_id) when is_binary(project_id) do
    Operately.Access.get_context!(project_id: project_id)
  end
end
