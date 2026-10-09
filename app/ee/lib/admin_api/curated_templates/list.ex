defmodule OperatelyEE.AdminApi.CuratedTemplates.List do
  use TurboConnect.Query
  alias OperatelyWeb.Api.Serializer

  inputs do
    field? :type, :curated_template_type
    field? :state, :curated_template_state
    field? :category, :string
    field? :search, :string
    field? :archived, :boolean
    field? :limit, :integer
    field? :offset, :integer
  end

  outputs do
    field :templates, list_of(:curated_template)
    field :total, :integer
  end

  def call(_conn, inputs) do
    result = Operately.CuratedTemplates.list(inputs, :admin)
    {:ok, %{templates: Serializer.serialize(result.templates, level: :essential), total: result.total}}
  end
end
