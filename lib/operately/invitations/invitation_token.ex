defmodule Operately.Invitations.InvitationToken do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "invitation_tokens" do
    belongs_to :invitation, Operately.Invitations.Invitation

    field :token, :string, virtual: true, redact: true
    field :hashed_token, :string, redact: true
    field :valid_until, :utc_datetime

    timestamps()
  end

  def changeset(attrs, opts \\ []) do
    changeset(%__MODULE__{}, attrs, opts)
  end

  def changeset(invitation_token, attrs, opts) do
    invitation_token
    |> cast(attrs, [:token, :invitation_id])
    |> validate_required([:token, :invitation_id])
    |> validate_length(:token, min: 32, max: 72)
    |> hash_and_put_token
    |> put_valid_until(opts)
  end

  defp hash_and_put_token(changeset) do
    token = get_change(changeset, :token)

    changeset
    |> validate_length(:token, max: 72, count: :bytes)
    |> put_change(:hashed_token, hash_token(token))
    |> delete_change(:token)
  end

  defp put_valid_until(changeset, opts) do
    minutes = Keyword.get(opts, :minutes, 60)

    valid_until = DateTime.add(DateTime.utc_now(), minutes * 60, :second) |> DateTime.truncate(:second)
    put_change(changeset, :valid_until, valid_until)
  end

  def build_token(opts \\ []) do
    length = Keyword.get(opts, :length, 32)

    :crypto.strong_rand_bytes(length)
    |> Base.url_encode64
    |> binary_part(0, length)
  end

  def hash_token(token) do
    :crypto.hash(:sha256, token) |> Base.url_encode64()
  end

  def valid_token_time?(token, time_limit) do
    DateTime.compare(time_limit, token.valid_until) == :lt
  end
end
