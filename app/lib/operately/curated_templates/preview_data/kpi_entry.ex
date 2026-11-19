defmodule Operately.CuratedTemplates.PreviewData.KpiEntry do
  use Ecto.Schema
  alias Operately.CuratedTemplates.Definitions
  @primary_key false

  embedded_schema do
    field :period_offset, :integer
    field :value, :float
  end

  def changeset(schema, attrs) do
    Definitions.cast_fields(schema, attrs, [:period_offset, :value], [:period_offset, :value], :published)
  end
end
