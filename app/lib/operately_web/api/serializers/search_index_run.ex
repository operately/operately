defimpl OperatelyWeb.Api.Serializable, for: Operately.Search.IndexRun do
  def serialize(run, level: :essential) do
    %{
      id: run.id,
      kind: run.kind,
      status: run.status,
      phase: run.phase,
      processed_count: run.processed_count,
      inserted_count: run.inserted_count,
      updated_count: run.updated_count,
      unchanged_count: run.unchanged_count,
      superseded_count: run.superseded_count,
      skipped_count: run.skipped_count,
      failed_count: run.failed_count,
      deleted_orphan_count: run.deleted_orphan_count,
      last_error: run.last_error,
      started_at: run.started_at,
      completed_at: run.completed_at,
      inserted_at: run.inserted_at
    }
  end
end
