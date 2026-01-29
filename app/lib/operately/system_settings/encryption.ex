defmodule Operately.SystemSettings.Encryption do
  @moduledoc """
  Settings secrets rotation flow: encryption uses the first key in
  `SYSTEM_SETTINGS_ENCRYPTION_KEYS` (or `SECRET_KEY_BASE` fallback), while
  decryption tries all keys in order to support temporary key rings during
  rotation.
  """

  @aad "operately:system_settings:secrets"
  @salt "operately_system_settings_secrets_v1"
  @cipher :aes_256_gcm
  @iterations 1000
  @key_length 32
  @iv_length 12
  @tag_length 16
  @version 1

  def encrypt(plaintext) when is_binary(plaintext) do
    [key | _] = keys()
    iv = :crypto.strong_rand_bytes(@iv_length)

    {ciphertext, tag} =
      :crypto.crypto_one_time_aead(@cipher, key, iv, plaintext, @aad, true)

    <<@version::8, iv::binary-size(@iv_length), tag::binary-size(@tag_length), ciphertext::binary>>
  end

  def decrypt(<<@version::8, iv::binary-size(@iv_length), tag::binary-size(@tag_length), ciphertext::binary>>) do
    keys()
    |> Enum.reduce_while({:error, :invalid}, fn key, _acc ->
      case :crypto.crypto_one_time_aead(@cipher, key, iv, ciphertext, @aad, tag, false) do
        :error -> {:cont, {:error, :invalid}}
        plaintext -> {:halt, {:ok, plaintext}}
      end
    end)
  end

  def decrypt(_), do: {:error, :invalid}

  defp keys do
    case :persistent_term.get({__MODULE__, :keys}, :missing) do
      :missing ->
        derived_keys = derive_keys()
        :persistent_term.put({__MODULE__, :keys}, derived_keys)
        derived_keys

      derived_keys ->
        derived_keys
    end
  end

  defp derive_keys do
    base_secrets = encryption_base_secrets()

    Enum.map(base_secrets, fn base_secret ->
      Plug.Crypto.KeyGenerator.generate(base_secret, @salt, iterations: @iterations, length: @key_length)
    end)
  end

  defp application_secret_key_base do
    Application.get_env(:operately, OperatelyWeb.Endpoint, [])
    |> Keyword.get(:secret_key_base)
  end

  defp encryption_base_secrets do
    System.get_env("SYSTEM_SETTINGS_ENCRYPTION_KEYS")
    |> presence()
    |> parse_keys()
    |> case do
      [] -> [application_secret_key_base()]
      keys -> keys
    end
    |> case do
      [nil] -> raise "secret_key_base is missing, cannot encrypt system settings"
      [nil | _] -> raise "secret_key_base is missing, cannot encrypt system settings"
      keys -> keys
    end
  end

  defp parse_keys(nil), do: []

  defp parse_keys(value) do
    value
    |> String.split(",", trim: true)
    |> Enum.map(&String.trim/1)
    |> Enum.reject(&(&1 == ""))
  end

  defp presence(value) when value in [nil, ""], do: nil
  defp presence(value), do: value
end
