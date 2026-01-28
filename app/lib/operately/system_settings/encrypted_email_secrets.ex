defmodule Operately.SystemSettings.EncryptedEmailSecrets do
  @moduledoc false

  @behaviour Ecto.Type

  alias Operately.SystemSettings.EmailSecrets
  alias Operately.SystemSettings.Encryption

  def type, do: :binary

  def cast(nil), do: {:ok, %EmailSecrets{}}
  def cast(%EmailSecrets{} = value), do: {:ok, value}

  def cast(value) when is_map(value) do
    value = normalize_keys(value)

    changeset = EmailSecrets.changeset(%EmailSecrets{}, value)

    if changeset.valid? do
      {:ok, Ecto.Changeset.apply_changes(changeset)}
    else
      :error
    end
  end

  def cast(_), do: :error

  def embed_as(_format), do: :self
  def equal?(term1, term2), do: term1 == term2

  def dump(nil), do: dump(%EmailSecrets{})
  def dump(%EmailSecrets{} = value), do: dump(Map.from_struct(value))

  def dump(value) when is_map(value) do
    plaintext = Jason.encode!(value)
    {:ok, Encryption.encrypt(plaintext)}
  end

  def dump(_), do: :error

  def load(nil), do: {:ok, %EmailSecrets{}}

  def load(value) when is_binary(value) do
    with {:ok, plaintext} <- Encryption.decrypt(value),
         {:ok, decoded} <- Jason.decode(plaintext) do
      {:ok, to_email_secrets(decoded)}
    else
      _ -> :error
    end
  end

  def load(_), do: :error

  defp to_email_secrets(map) when is_map(map) do
    map = normalize_keys(map)

    %EmailSecrets{}
    |> EmailSecrets.changeset(map)
    |> Ecto.Changeset.apply_changes()
  end

  defp normalize_keys(map) do
    smtp_password =
      Map.get(map, "smtp_password") || Map.get(map, :smtp_password) || Map.get(map, "password") || Map.get(map, :password)

    sendgrid_api_key = Map.get(map, "sendgrid_api_key") || Map.get(map, :sendgrid_api_key)

    %{
      "smtp_password" => smtp_password,
      "sendgrid_api_key" => sendgrid_api_key
    }
    |> Enum.reject(fn {_key, value} -> is_nil(value) end)
    |> Map.new()
  end
end
