defmodule Operately.ProjectTemplates.Discussion do
  @moduledoc """
  A reusable discussion that belongs to a project template.

  It also provides lightweight discussion metadata for template read models.
  """

  import Ecto.Query, only: [from: 2]

  def __api_typename__, do: "project_template_discussion"

  use Operately.Schema

  alias Operately.ProjectTemplates.ProjectTemplate
  alias Operately.Repo

  schema "project_template_discussions" do
    belongs_to :project_template, ProjectTemplate
    belongs_to :author, Operately.People.Person

    field :title, :string
    field :body, :map
    field :position, :integer

    timestamps()
  end

  def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

  def changeset(discussion, attrs) do
    discussion
    |> cast(attrs, [:project_template_id, :author_id, :title, :body, :position])
    |> validate_required([:project_template_id, :title, :body, :position])
  end

  def put_inactive_counts([]), do: []

  def put_inactive_counts(templates) do
    counts = inactive_counts(Enum.map(templates, & &1.id))

    Enum.map(templates, fn template ->
      %{template | inactive_discussion_count: Map.get(counts, template.id, 0)}
    end)
  end

  def author_active?(nil, _company_id), do: false

  def author_active?(author, company_id) do
    author.company_id == company_id and author.suspended != true and is_nil(author.suspended_at)
  end

  defp inactive_counts(template_ids) do
    from(discussion in __MODULE__,
      join: template in assoc(discussion, :project_template),
      left_join: author in assoc(discussion, :author),
      where: discussion.project_template_id in ^template_ids,
      where: is_nil(author.id) or author.company_id != template.company_id or author.suspended == true or not is_nil(author.suspended_at),
      group_by: discussion.project_template_id,
      select: {discussion.project_template_id, count(discussion.id)}
    )
    |> Repo.all()
    |> Map.new()
  end
end
