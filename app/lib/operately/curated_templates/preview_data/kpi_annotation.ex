defmodule Operately.CuratedTemplates.PreviewData.KpiAnnotation do
  use Ecto.Schema
  alias Operately.CuratedTemplates.Definitions
  @primary_key false

  embedded_schema do
    field :period_offset, :integer
    field :title, :string
  end

  def changeset(schema, attrs) do
    Definitions.cast_fields(schema, attrs, [:period_offset, :title], [:period_offset, :title], :published)
  end
end
