defmodule Operately.Blobs.Blob do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "blobs" do
    belongs_to :company, Operately.Companies.Company
    belongs_to :author, Operately.People.Person

    field :filename, :string
    field :status, Ecto.Enum, values: [:pending, :uploaded, :deleted]
    field :storage_type, Ecto.Enum, values: [:s3, :local]

    timestamps()
  end

  @doc false
  def changeset(blob, attrs) do
    blob
    |> cast(attrs, [:filename, :author_id, :company_id, :status])
    |> set_storage_type()
    |> validate_required([:filename, :author_id, :company_id, :status, :storage_type])
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
end
