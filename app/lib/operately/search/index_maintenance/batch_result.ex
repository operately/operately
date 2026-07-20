defmodule Operately.Search.IndexMaintenance.BatchResult do
  @moduledoc """
  Describes the outcome of one search-index maintenance batch.

  The batch processor reports what changed and whether it reached the end of its
  current pass. The run lifecycle uses this result to update durable counters,
  advance the cursor, schedule another batch, or complete the run.
  """

  defstruct cursor: nil,
            exhausted?: false,
            processed: 0,
            inserted: 0,
            updated: 0,
            unchanged: 0,
            superseded: 0,
            skipped: 0,
            failed: 0,
            deleted_orphans: 0,
            last_error: nil

  def with_page(%__MODULE__{} = result, cursor, record_count, batch_size) do
    %{result | cursor: cursor, exhausted?: record_count < batch_size}
  end
end
