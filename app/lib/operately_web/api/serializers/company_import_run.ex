defimpl OperatelyWeb.Api.Serializable, for: Operately.CompanyTransfers.ImportRun do
  alias Operately.CompanyTransfers.PublicErrorMessage
  alias OperatelyWeb.Api.Serializer

  def serialize(run, level: _level) do
    %{
      id: run.id,
      company: Serializer.serialize(run.company),
      company_id: run.company_id,
      requested_by_id: run.requested_by_id,
      status: to_string(run.status),
      current_step: run.current_step,
      percentage: run.percentage,
      tables_count: run.tables_count,
      rows_count: run.rows_count,
      package_blob_id: run.package_blob_id,
      error_message: PublicErrorMessage.for_import(run),
      validation_errors: run.validation_errors,
      manifest_summary: run.manifest_summary,
      inserted_at: Serializer.serialize(run.inserted_at),
      started_at: Serializer.serialize(run.started_at),
      completed_at: Serializer.serialize(run.completed_at)
    }
  end
end
