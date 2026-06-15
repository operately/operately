defmodule OperatelyEE.AdminApi.Mutations.CreateSiteMessage do
  use TurboConnect.Mutation

  alias Operately.SiteMessages

  inputs do
    field :title, :string
    field :description, :json
    field :all_companies, :boolean
    field :active, :boolean
    field? :expires_at, :datetime
    field? :company_ids, list_of(:string)
  end

  outputs do
    field :message, :site_message
  end

  def call(_conn, inputs) do
    attrs =
      inputs
      |> Map.take([:title, :description, :all_companies, :active, :expires_at, :company_ids])
      |> Map.update(:company_ids, [], fn ids -> ids || [] end)

    case SiteMessages.create(attrs) do
      {:ok, message} ->
        {:ok, %{message: OperatelyWeb.Api.Serializer.serialize(message, level: :full)}}

      {:error, :invalid_company_id} ->
        {:error, :bad_request, "One or more selected companies are invalid"}

      {:error, %Ecto.Changeset{}} ->
        {:error, :bad_request, "Invalid site message parameters"}
    end
  end
end
