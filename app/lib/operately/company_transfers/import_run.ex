defmodule Operately.CompanyTransfers.ImportRun do
  use Operately.Schema

  @statuses [:pending, :running, :completed, :failed, :cancelled]

  schema "company_import_runs" do
    belongs_to :company, Operately.Companies.Company
    belongs_to :requested_by, Operately.People.Account, foreign_key: :requested_by_id
    belongs_to :cancelled_by, Operately.People.Account, foreign_key: :cancelled_by_id
    belongs_to :package_blob, Operately.Blobs.Blob

    field :status, Ecto.Enum, values: @statuses, default: :pending
    field :current_step, :string
    field :total_steps, :integer, default: 0
    field :percentage, :float, default: 0.0
    field :current_table, :string

    field :tables_count, :integer, default: 0
    field :rows_count, :integer, default: 0
    field :files_count, :integer, default: 0

    field :validation_errors, {:array, :map}, default: []
    field :manifest_summary, :map, default: %{}
    field :artifacts_metadata, :map, default: %{}
    field :workspace_path, :string
    field :error_message, :string

    field :started_at, :utc_datetime_usec
    field :completed_at, :utc_datetime_usec
    field :cancelled_at, :utc_datetime_usec

    timestamps()
  end

  def statuses, do: @statuses

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(run, attrs) do
    run
    |> cast(attrs, [
      :company_id,
      :requested_by_id,
      :cancelled_by_id,
      :package_blob_id,
      :status,
      :current_step,
      :total_steps,
      :percentage,
      :current_table,
      :tables_count,
      :rows_count,
      :files_count,
      :validation_errors,
      :manifest_summary,
      :artifacts_metadata,
      :workspace_path,
      :error_message,
      :started_at,
      :completed_at,
      :cancelled_at
    ])
    |> validate_required([:requested_by_id, :status])
    |> validate_number(:total_steps, greater_than_or_equal_to: 0)
    |> validate_number(:percentage, greater_than_or_equal_to: 0.0, less_than_or_equal_to: 100.0)
    |> validate_number(:tables_count, greater_than_or_equal_to: 0)
    |> validate_number(:rows_count, greater_than_or_equal_to: 0)
    |> validate_number(:files_count, greater_than_or_equal_to: 0)
    |> assoc_constraint(:company)
    |> assoc_constraint(:requested_by)
    |> assoc_constraint(:cancelled_by)
    |> assoc_constraint(:package_blob)
  end
end
