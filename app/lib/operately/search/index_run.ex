defmodule Operately.Search.IndexRun do
  @moduledoc """
  Stores durable progress for a multi-batch search-index backfill or reconciliation.

  Oban executes individual batches, while an index run keeps the cursor, lifecycle,
  counters, and sanitized failure details needed to resume safely after retries or deployments.
  """

  use Operately.Schema
  alias Operately.Search.Entry

  @kinds [:backfill, :reconciliation]
  @statuses [:pending, :running, :completed, :completed_with_errors, :failed]
  @phases [:sources, :orphans]

  schema "search_index_runs" do
    field :source_type, Ecto.Enum, values: Entry.source_types()
    field :kind, Ecto.Enum, values: @kinds
    field :status, Ecto.Enum, values: @statuses, default: :pending
    field :phase, Ecto.Enum, values: @phases, default: :sources
    field :cursor, :binary_id
    field :processed_count, :integer, default: 0
    field :inserted_count, :integer, default: 0
    field :updated_count, :integer, default: 0
    field :unchanged_count, :integer, default: 0
    field :skipped_count, :integer, default: 0
    field :failed_count, :integer, default: 0
    field :deleted_orphan_count, :integer, default: 0
    field :last_error, :string
    field :started_at, :utc_datetime_usec
    field :completed_at, :utc_datetime_usec

    timestamps()
  end

  def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

  def changeset(run, attrs) do
    run
    |> cast(attrs, [
      :source_type,
      :kind,
      :status,
      :phase,
      :cursor,
      :processed_count,
      :inserted_count,
      :updated_count,
      :unchanged_count,
      :skipped_count,
      :failed_count,
      :deleted_orphan_count,
      :last_error,
      :started_at,
      :completed_at
    ])
    |> validate_required([:source_type, :kind, :status, :phase])
    |> validate_number(:processed_count, greater_than_or_equal_to: 0)
    |> validate_number(:inserted_count, greater_than_or_equal_to: 0)
    |> validate_number(:updated_count, greater_than_or_equal_to: 0)
    |> validate_number(:unchanged_count, greater_than_or_equal_to: 0)
    |> validate_number(:skipped_count, greater_than_or_equal_to: 0)
    |> validate_number(:failed_count, greater_than_or_equal_to: 0)
    |> validate_number(:deleted_orphan_count, greater_than_or_equal_to: 0)
    |> unique_constraint(:source_type, name: :search_index_runs_one_active_per_source_index)
  end
end
