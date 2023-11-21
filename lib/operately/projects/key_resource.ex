defmodule Operately.Projects.KeyResource do
  use Operately.Schema

  schema "project_key_resources" do
    belongs_to :project, Operately.Projects.Project, foreign_key: :project_id

    field :link, :string
    field :title, :string
    field :resource_type, :string

    timestamps()
  end

  @doc false
  def changeset(key_resource, attrs) do
    key_resource
    |> cast(attrs, [:title, :link, :project_id, :resource_type])
    |> validate_required([:title, :link, :project_id, :resource_type])
  end
end
