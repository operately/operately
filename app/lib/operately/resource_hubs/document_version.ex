defmodule Operately.ResourceHubs.DocumentVersion do
  use Operately.Schema

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo

  @valid_origins [:created, :edited, :restored, :migration]

  schema "resource_document_versions" do
    belongs_to :document, Operately.ResourceHubs.Document, foreign_key: :document_id
    belongs_to :editor, Operately.People.Person, foreign_key: :editor_id

    field :version_number, :integer
    field :title, :string
    field :content, :map
    field :content_schema_version, :integer
    field :origin, Ecto.Enum, values: @valid_origins
    field :restored_from_version_number, :integer

    timestamps(updated_at: false)
  end

  def changeset(attrs) when is_map(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(version, attrs) do
    version
    |> cast(attrs, [
      :document_id,
      :version_number,
      :title,
      :content,
      :content_schema_version,
      :editor_id,
      :origin,
      :restored_from_version_number,
      :inserted_at
    ])
    |> validate_required([
      :document_id,
      :version_number,
      :title,
      :content,
      :content_schema_version,
      :origin
    ])
    |> validate_number(:version_number, greater_than: 0)
    |> validate_number(:content_schema_version, greater_than: 0)
    |> validate_number(:restored_from_version_number, greater_than: 0)
    |> validate_inclusion(:origin, @valid_origins)
    |> validate_restored_from_matches_origin()
    |> unique_constraint([:document_id, :version_number])
    |> foreign_key_constraint(:document_id)
    |> foreign_key_constraint(:editor_id)
  end

  def valid_origins, do: @valid_origins

  def list_for_document(document_id) do
    from(v in __MODULE__,
      where: v.document_id == ^document_id,
      order_by: [desc: v.version_number]
    )
    |> Repo.all()
  end

  def get_by_document_and_number(document_id, version_number) do
    from(v in __MODULE__,
      where: v.document_id == ^document_id and v.version_number == ^version_number
    )
    |> Repo.one()
  end

  defp validate_restored_from_matches_origin(changeset) do
    origin = get_field(changeset, :origin)
    restored_from = get_field(changeset, :restored_from_version_number)

    cond do
      origin == :restored and is_nil(restored_from) ->
        add_error(changeset, :restored_from_version_number, "must be present when origin is restored")

      origin != :restored and not is_nil(restored_from) ->
        add_error(changeset, :restored_from_version_number, "must be blank unless origin is restored")

      true ->
        changeset
    end
  end
end
