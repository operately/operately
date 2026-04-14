defimpl OperatelyWeb.Api.Serializable, for: Operately.CompanyTransfers.ExportRun do
  alias Operately.Blobs

  def serialize(run, level: level) do
    base_fields = %{
      id: run.id,
      company_id: run.company_id,
      requested_by_id: run.requested_by_id,
      status: to_string(run.status),
      current_step: run.current_step,
      percentage: run.percentage,
      tables_count: run.tables_count,
      rows_count: run.rows_count,
      error_message: run.error_message,
      inserted_at: run.inserted_at,
      started_at: run.started_at,
      completed_at: run.completed_at
    }

    case level do
      :essential -> base_fields
      _ -> Map.merge(base_fields, blob_fields(run))
    end
  end

  defp blob_fields(run) do
    %{
      json_blob_id: run.json_blob_id,
      zip_blob_id: run.zip_blob_id,
      json_download_url: signed_url(run.json_blob),
      zip_download_url: signed_url(run.zip_blob),
      json_size_bytes: run.json_size_bytes,
      zip_size_bytes: run.zip_size_bytes
    }
  end

  defp signed_url(nil), do: nil
  defp signed_url(%Ecto.Association.NotLoaded{}), do: nil
  defp signed_url(blob) do
    case Blobs.get_signed_get_url(blob, "attachment") do
      {:ok, url} -> url
      _ -> nil
    end
  end
end
