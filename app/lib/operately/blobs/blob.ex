defmodule Operately.Blobs.Blob do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @purposes [:company_file, :company_transfer_import_artifact]

  schema "blobs" do
    belongs_to :company, Operately.Companies.Company
    belongs_to :author, Operately.People.Person
    belongs_to :account, Operately.People.Account

    field :purpose, Ecto.Enum, values: @purposes, default: :company_file
    field :status, Ecto.Enum, values: [:pending, :uploaded, :deleted]
    field :storage_type, Ecto.Enum, values: [:s3, :local]

    field :filename, :string
    field :size, :integer, default: 0
    field :content_type, :string
    field :height, :integer
    field :width, :integer

    timestamps()
  end

  @doc false
  def changeset(blob, attrs) do
    blob
    |> cast(attrs, [:filename, :author_id, :company_id, :account_id, :purpose, :status, :size, :content_type, :height, :width])
    |> set_storage_type()
    |> validate_required([:filename, :purpose, :status, :storage_type, :size, :content_type])
    |> validate_owner_shape()
    |> assoc_constraint(:company)
    |> assoc_constraint(:author)
    |> assoc_constraint(:account)
  end

  defp set_storage_type(blob) do
    case Application.get_env(:operately, :storage_type) do
      "s3" -> put_change(blob, :storage_type, :s3)
      "local" -> put_change(blob, :storage_type, :local)
      e -> raise "Storage type #{inspect(e)} not supported"
    end
  end

  def upload_strategy(blob) do
    case blob.storage_type do
      :s3 -> "direct"
      :local -> "multipart"
      e -> raise "Storage type #{inspect(e)} not supported"
    end
  end

  def url(blob) do
    "/blobs/#{blob.id}"
  end

  @doc """
  Returns the storage path for a blob.
  This pattern is used consistently across local filesystem and S3 storage.
  """
  def path(blob) do
    case blob.purpose do
      :company_transfer_import_artifact -> "company-transfer-import-artifacts/#{blob.account_id}/#{blob.id}"
      _ -> "#{blob.company_id}-#{blob.id}"
    end
  end

  defp validate_owner_shape(changeset) do
    case get_field(changeset, :purpose) do
      :company_file ->
        changeset
        |> validate_required([:author_id, :company_id])
        |> validate_field_nil(:account_id, "must be empty for company file blobs")

      :company_transfer_import_artifact ->
        changeset
        |> validate_required([:account_id])
        |> validate_field_nil(:author_id, "must be empty for import artifact blobs")
        |> validate_field_nil(:company_id, "must be empty for import artifact blobs")

      purpose ->
        raise ArgumentError, "Unhandled blob purpose in validate_owner_shape/1: #{inspect(purpose)}"
    end
  end

  defp validate_field_nil(changeset, field, message) do
    validate_change(changeset, field, fn ^field, value ->
      if is_nil(value), do: [], else: [{field, message}]
    end)
  end
end
