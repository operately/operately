defmodule OperatelyEE.AdminApi.Mutations.UpdateSiteMessage do
  use TurboConnect.Mutation

  alias Operately.SiteMessages
  alias Operately.SiteMessages.SiteMessage

  inputs do
    field :id, :string
    field? :title, :string
    field? :description, :json
    field? :all_companies, :boolean
    field? :active, :boolean
    field? :expires_at, :datetime
    field? :company_ids, list_of(:string)
  end

  outputs do
    field :message, :site_message
  end

  def call(_conn, inputs) do
    with {:ok, id} <- decode_id(inputs.id),
         {:ok, %SiteMessage{} = message} <- find_message(id),
         attrs <- build_attrs(inputs),
         {:ok, updated} <- SiteMessages.update(message, attrs) do
      {:ok, %{message: OperatelyWeb.Api.Serializer.serialize(updated, level: :full)}}
    else
      {:error, :not_found, message} ->
        {:error, :not_found, message}

      {:error, :bad_request, message} ->
        {:error, :bad_request, message}

      {:error, :invalid_company_id} ->
        {:error, :bad_request, "One or more selected companies are invalid"}

      {:error, %Ecto.Changeset{}} ->
        {:error, :bad_request, "Invalid site message parameters"}
    end
  end

  defp find_message(id) do
    case SiteMessages.get(id) do
      nil -> {:error, :not_found, "Site message not found"}
      message -> {:ok, message}
    end
  end

  defp decode_id(id) do
    case Operately.ShortUuid.decode(id) do
      {:ok, decoded} -> {:ok, decoded}
      _ -> {:error, :bad_request, "Invalid site message ID"}
    end
  end

  defp build_attrs(inputs) do
    inputs
    |> Map.drop([:id])
    |> Enum.reject(fn {_key, value} -> is_nil(value) end)
    |> Map.new()
  end
end
