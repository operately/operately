defmodule OperatelyEE.AdminApi.CuratedTemplates.Validate do
  use TurboConnect.Mutation
  alias Operately.CuratedTemplates.Template
  alias OperatelyEE.AdminApi.CuratedTemplates.Shared

  inputs do
    field :type, :curated_template_type
    field :title, :string
    field? :summary, :string, null: true
    field? :category, :string, null: true
    field :content_language, :string
    field :definition, :json
  end

  outputs do
    field :valid, :boolean
    field :errors, list_of(:curated_template_validation_error)
  end

  def call(_conn, inputs) do
    cs = Template.changeset(%Template{state: :published}, inputs)
    {:ok, %{valid: cs.valid?, errors: Shared.errors(cs)}}
  end
end
