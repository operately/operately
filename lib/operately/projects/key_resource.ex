defmodule Operately.Projects.KeyResource do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "project_key_resources" do
    belongs_to :project, Operately.Projects.Project, foreign_key: :project_id
    has_one :access_context, through: [:project, :access_context]

    field :link, :string
    field :title, :string
    field :resource_type, :string

    timestamps()
    request_info()
    requester_access_level()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(key_resource, attrs) do
    key_resource
    |> cast(attrs, [:title, :link, :project_id, :resource_type])
    |> validate_required([:title, :link, :project_id, :resource_type])
  end
end
