defmodule Operately.InviteLinks.InviteLink do
  use Operately.Schema

  schema "invite_links" do
    field :token, :string
    field :expires_at, :utc_datetime
    field :use_count, :integer, default: 0
    field :is_active, :boolean, default: true

    belongs_to :company, Operately.Companies.Company
    belongs_to :author, Operately.People.Person

    timestamps()
  end

  def changeset(invite_link \\ %__MODULE__{}, attrs) do
    invite_link
    |> cast(attrs, [:token, :company_id, :author_id, :expires_at, :use_count, :is_active])
    |> validate_required([:token, :company_id, :author_id, :expires_at])
    |> validate_length(:token, min: 32, max: 72)
    |> unique_constraint(:token)
    |> put_expires_at_if_not_set()
  end

  defp put_expires_at_if_not_set(changeset) do
    case get_field(changeset, :expires_at) do
      nil ->
        expires_at = DateTime.add(DateTime.utc_now(), 7 * 24 * 60 * 60, :second)
        put_change(changeset, :expires_at, expires_at)
      _ -> 
        changeset
    end
  end

  def build_token(opts \\ []) do
    length = Keyword.get(opts, :length, 32)

    :crypto.strong_rand_bytes(length)
    |> Base.url_encode64()
    |> binary_part(0, length)
  end

  def is_expired?(%__MODULE__{expires_at: expires_at}) do
    DateTime.compare(expires_at, DateTime.utc_now()) == :lt
  end

  def is_valid?(%__MODULE__{is_active: is_active} = link) do
    is_active and not is_expired?(link)
  end
end