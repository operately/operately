defmodule Operately.CuratedTemplates.PreviewData.KpiAnnotation do
  use Ecto.Schema
  alias Operately.CuratedTemplates.Definitions
  @primary_key false

  embedded_schema do
    field :date, :date
    field :title, :string
  end

  def changeset(schema, attrs) do
    Definitions.cast_fields(schema, attrs, [:date, :title], [:date, :title], :published)
  end
end
