defmodule OperatelyEE.AdminApi.CuratedTemplates.Create do
  use TurboConnect.Mutation
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
    field? :template, :curated_template, null: true
    field :errors, list_of(:curated_template_validation_error)
  end

  def call(conn, inputs) do
    conn.assigns.current_account
    |> Operately.CuratedTemplates.create(inputs)
    |> Shared.respond()
  end
end
