defimpl OperatelyWeb.Api.Serializable, for: Operately.CompanyTransfers.ExportRun do
  alias Operately.Blobs
  alias Operately.CompanyTransfers.PublicErrorMessage
  alias OperatelyWeb.Api.Serializer

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
      error_message: PublicErrorMessage.for_export(run),
      inserted_at: Serializer.serialize(run.inserted_at),
      started_at: Serializer.serialize(run.started_at),
      completed_at: Serializer.serialize(run.completed_at)
    }

    case level do
      :essential -> base_fields
      _ -> Map.merge(base_fields, blob_fields(run))
    end
  end

  defp blob_fields(run) do
    %{
      package_blob_id: run.package_blob_id,
      package_download_url: signed_url(run.package_blob),
      package_size_bytes: run.package_size_bytes
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
