defmodule Operately.Projects.KeyResource do
  @moduledoc """
  Deprecated project key resources.

  Legacy links that lived on projects before Docs & Files. New key resources are
  no longer created; existing rows remain for historical activity and API reads.
  """

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
end
