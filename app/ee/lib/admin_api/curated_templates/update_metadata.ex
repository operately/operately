defmodule OperatelyEE.AdminApi.CuratedTemplates.UpdateMetadata do
  use TurboConnect.Mutation
  alias OperatelyEE.AdminApi.CuratedTemplates.Shared

  inputs do
    field :id, :id, null: false
    field :expected_updated_at, :datetime
    field? :category, :string, null: true
  end

  outputs do
    field? :template, :curated_template, null: true
    field :errors, list_of(:curated_template_validation_error)
  end

  def call(conn, inputs) do
    with {:ok, template} <- Shared.load(inputs.id) do
      Operately.Operations.CuratedTemplateUpdating.run(template, conn.assigns.current_account, inputs.expected_updated_at, {:metadata, inputs})
    end
    |> Shared.respond()
  end
end
