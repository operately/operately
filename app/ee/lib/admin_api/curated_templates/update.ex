defmodule OperatelyEE.AdminApi.CuratedTemplates.Update do
  use TurboConnect.Mutation
  alias OperatelyEE.AdminApi.CuratedTemplates.Shared

  inputs do
    field :id, :id, null: false
    field :expected_updated_at, :datetime
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
    with {:ok, template} <- Shared.load(inputs.id) do
      Operately.Operations.CuratedTemplateUpdating.run(template, conn.assigns.current_account, inputs.expected_updated_at, {:update, inputs})
    end
    |> Shared.respond()
  end
end
