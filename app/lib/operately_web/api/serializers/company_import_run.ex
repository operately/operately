defimpl OperatelyWeb.Api.Serializable, for: Operately.CompanyTransfers.ImportRun do
  def serialize(run, level: _level) do
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
      error_message: run.error_message,
      validation_errors: run.validation_errors,
      inserted_at: run.inserted_at,
      started_at: run.started_at,
      completed_at: run.completed_at
    }
  end
end
