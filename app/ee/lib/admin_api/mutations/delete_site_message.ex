defmodule OperatelyEE.AdminApi.Mutations.DeleteSiteMessage do
  use TurboConnect.Mutation

  alias Operately.SiteMessages
  alias Operately.SiteMessages.SiteMessage

  inputs do
    field :id, :string
  end

  outputs do
    field :success, :boolean
  end

  def call(_conn, inputs) do
    with {:ok, id} <- decode_id(inputs.id),
         {:ok, %SiteMessage{} = message} <- find_message(id),
         {:ok, _} <- SiteMessages.delete(message) do
      {:ok, %{success: true}}
    else
      {:error, :not_found, message} ->
        {:error, :not_found, message}

      {:error, :bad_request, message} ->
        {:error, :bad_request, message}
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
end
