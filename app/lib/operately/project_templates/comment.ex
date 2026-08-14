defmodule Operately.ProjectTemplates.Comment do
  @moduledoc """
  A reusable comment that belongs to a copied template parent resource.
  """

  def __api_typename__, do: "project_template_comment"

  use Operately.Schema

  alias Operately.ProjectTemplates.ProjectTemplate
  alias Operately.ProjectTemplates.Comments.{Materialization, ReverseCopy}

  @parent_types [:discussion, :document, :file, :link]

  schema "project_template_comments" do
    belongs_to :project_template, ProjectTemplate
    belongs_to :author, Operately.People.Person

    field :parent_type, Ecto.Enum, values: @parent_types
    field :parent_id, :binary_id
    field :content, :map
    field :position, :integer

    timestamps()
  end

  def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

  def changeset(comment, attrs) do
    comment
    |> cast(attrs, [:project_template_id, :author_id, :parent_type, :parent_id, :content, :position])
    |> validate_required([:project_template_id, :parent_type, :parent_id, :content, :position])
    |> validate_number(:position, greater_than_or_equal_to: 0)
    |> check_constraint(:position, name: :project_template_comments_position_non_negative)
  end

  def parent_types, do: @parent_types

  def copy_from_project(repo, project_id, template, parent_ids), do: ReverseCopy.run(repo, project_id, template, parent_ids)
  def materialize(repo, comments, parent_ids, company_id, creator_id), do: Materialization.run(repo, comments, parent_ids, company_id, creator_id)
end
