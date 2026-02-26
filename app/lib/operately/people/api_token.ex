defmodule Operately.People.ApiToken do
  use Operately.Schema

  @hash_algorithm :sha256
  @rand_size 32
  @token_prefix "opk_"

  schema "api_tokens" do
    field :name, :string
    field :token_hash, :binary
    field :read_only, :boolean, default: true
    field :last_used_at, :utc_datetime

    belongs_to :person, Operately.People.Person

    timestamps()
  end

  def changeset(api_token, attrs) do
    api_token
    |> cast(attrs, [:person_id, :name, :token_hash, :read_only, :last_used_at])
    |> normalize_name()
    |> validate_required([:person_id, :token_hash, :read_only])
    |> validate_length(:name, max: 255)
    |> foreign_key_constraint(:person_id)
    |> unique_constraint(:token_hash)
  end

  defp normalize_name(changeset) do
    case get_field(changeset, :name) do
      nil ->
        changeset

      name when is_binary(name) ->
        trimmed_name = String.trim(name)

        if trimmed_name == "" do
          put_change(changeset, :name, nil)
        else
          put_change(changeset, :name, trimmed_name)
        end

      _ ->
        changeset
    end
  end

  def generate_raw_token do
    random = :crypto.strong_rand_bytes(@rand_size)
    @token_prefix <> Base.url_encode64(random, padding: false)
  end

  def hash_token(raw_token) when is_binary(raw_token) do
    :crypto.hash(@hash_algorithm, raw_token)
  end

  def get_attr(attrs, key, default \\ nil) when is_map(attrs) do
    case Map.fetch(attrs, key) do
      {:ok, value} ->
        value

      :error ->
        Map.get(attrs, Atom.to_string(key), default)
    end
  end
end
