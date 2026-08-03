defmodule Operately.Projects.KeyResource do
  def __api_typename__, do: "project_key_resource"

  @moduledoc """
  Deprecated project key resources.

  Legacy links that lived on projects before Docs & Files. New key resources are
  no longer created; existing rows remain for historical activity and API reads.
  """

  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Repo.Getter.Profile

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

  def getter_profile(:default) do
    %Profile{scope: &scope_out_project_templates/1}
  end

  defp scope_out_project_templates(query) do
    from [resource: key_resource] in query,
      join: project in assoc(key_resource, :project),
      where: project.kind == :project
  end
end
