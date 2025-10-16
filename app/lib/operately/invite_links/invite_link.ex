defmodule Operately.InviteLinks.InviteLink do
  use Operately.Schema

  schema "invite_links" do
    field(:token, :string)
    field(:expires_at, :utc_datetime)
    field(:use_count, :integer, default: 0)
    field(:is_active, :boolean, default: true)
    field(:allowed_domains, {:array, :string}, default: [])

    belongs_to(:company, Operately.Companies.Company)
    belongs_to(:author, Operately.People.Person)

    timestamps()
  end

  def changeset(invite_link \\ %__MODULE__{}, attrs) do
    invite_link
    |> cast(attrs, [:token, :company_id, :author_id, :expires_at, :use_count, :is_active, :allowed_domains])
    |> update_change(:expires_at, &truncate_datetime/1)
    |> normalize_allowed_domains()
    |> put_expires_at_if_not_set()
    |> validate_required([:token, :company_id, :author_id, :expires_at])
    |> validate_length(:token, min: 32, max: 72)
    |> validate_allowed_domains()
    |> unique_constraint(:token)
  end

  defp put_expires_at_if_not_set(changeset) do
    case get_field(changeset, :expires_at) do
      nil ->
        expires_at =
          DateTime.utc_now()
          |> DateTime.truncate(:second)
          |> DateTime.add(7 * 24 * 60 * 60, :second)

        put_change(changeset, :expires_at, expires_at)

      _ ->
        changeset
    end
  end

  defp truncate_datetime(nil), do: nil
  defp truncate_datetime(datetime), do: DateTime.truncate(datetime, :second)

  defp normalize_allowed_domains(changeset) do
    case fetch_change(changeset, :allowed_domains) do
      {:ok, value} ->
        put_change(changeset, :allowed_domains, normalize_allowed_domains_value(value))

      :error ->
        changeset
    end
  end

  defp normalize_allowed_domains_value(nil), do: []

  defp normalize_allowed_domains_value(domains) when is_list(domains) do
    domains
    |> Enum.map(&normalize_domain/1)
    |> Enum.reject(&is_nil/1)
    |> Enum.uniq()
  end

  defp normalize_allowed_domains_value(_), do: []

  defp normalize_domain(domain) when is_binary(domain) do
    domain
    |> String.trim()
    |> String.downcase()
    |> case do
      "" -> nil
      value -> value
    end
  end

  defp normalize_domain(_), do: nil

  defp validate_allowed_domains(changeset) do
    validate_change(changeset, :allowed_domains, fn :allowed_domains, domains ->
      domains
      |> Enum.reduce([], fn domain, acc ->
        if valid_domain?(domain) do
          acc
        else
          [{:allowed_domains, "contains invalid domain #{domain}"} | acc]
        end
      end)
    end)
  end

  defp valid_domain?(domain) do
    Regex.match?(~r/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/, domain)
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
