defimpl OperatelyWeb.Api.Serializable, for: Operately.CompanyTransfers.ExportRun do
  alias Operately.Repo
  alias Operately.Blobs

  def serialize(run, level: _level) do
    run = Repo.preload(run, [:json_blob, :zip_blob])

    %{
      id: run.id,
      company_id: run.company_id,
      requested_by_id: run.requested_by_id,
      status: to_string(run.status),
      current_step: run.current_step,
      percentage: run.percentage,
      tables_count: run.tables_count,
      rows_count: run.rows_count,
      json_blob_id: run.json_blob_id,
      zip_blob_id: run.zip_blob_id,
      json_download_url: signed_url(run.json_blob),
      zip_download_url: signed_url(run.zip_blob),
      json_size_bytes: run.json_size_bytes,
      zip_size_bytes: run.zip_size_bytes,
      error_message: run.error_message,
      inserted_at: run.inserted_at,
      started_at: run.started_at,
      completed_at: run.completed_at
    }
  end

  defp signed_url(nil), do: nil
  defp signed_url(blob) do
    case Blobs.get_signed_get_url(blob, "attachment") do
      {:ok, url} -> url
      _ -> nil
    end
  end
end
