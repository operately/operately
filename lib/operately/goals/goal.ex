defmodule Operately.Goals.Goal do
  use Operately.Schema

  import Ecto.Changeset
  import Operately.SoftDelete.Schema

  schema "goals" do
    belongs_to :company, Operately.Companies.Company, foreign_key: :company_id
    belongs_to :group, Operately.Groups.Group, foreign_key: :group_id

    belongs_to :champion, Operately.People.Person, foreign_key: :champion_id
    belongs_to :reviewer, Operately.People.Person, foreign_key: :reviewer_id
    belongs_to :creator, Operately.People.Person, foreign_key: :creator_id
    has_many :targets, Operately.Goals.Target
    has_many :projects, Operately.Projects.Project, foreign_key: :goal_id

    field :name, :string
    field :timeframe, :string
    field :next_update_scheduled_at, :utc_datetime

    field :description, :map

    timestamps()
    soft_delete()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(goal, attrs) do
    goal
    |> cast(attrs, [
      :name, 
      :company_id, 
      :group_id, 
      :champion_id, 
      :reviewer_id, 
      :creator_id, 
      :timeframe, 
      :description,
      :next_update_scheduled_at
    ])
    |> validate_required([
      :name, 
      :company_id, 
      :group_id, 
      :champion_id, 
      :reviewer_id, 
      :creator_id,
      :timeframe,
    ])
  end
end
