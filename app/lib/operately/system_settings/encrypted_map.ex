defmodule Operately.SystemSettings.EncryptedMap do
  @moduledoc false

  @behaviour Ecto.Type

  def type, do: :binary

  def cast(nil), do: {:ok, %{}}
  def cast(value) when is_map(value), do: {:ok, value}
  def cast(_), do: :error

  def embed_as(_format), do: :self
  def equal?(term1, term2), do: term1 == term2

  def dump(nil), do: dump(%{})

  def dump(value) when is_map(value) do
    plaintext = Jason.encode!(value)
    {:ok, Operately.SystemSettings.Encryption.encrypt(plaintext)}
  end

  def dump(_), do: :error

  def load(nil), do: {:ok, %{}}

  def load(value) when is_binary(value) do
    with {:ok, plaintext} <- Operately.SystemSettings.Encryption.decrypt(value),
         {:ok, decoded} <- Jason.decode(plaintext) do
      {:ok, decoded}
    else
      _ -> :error
    end
  end

  def load(_), do: :error
end
