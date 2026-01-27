defmodule Operately.SystemSettings.Encryption do
  @moduledoc false

  @aad "operately:system_settings:secrets"
  @salt "operately_system_settings_secrets_v1"
  @cipher :aes_256_gcm
  @iterations 1000
  @key_length 32
  @iv_length 12
  @tag_length 16
  @version 1

  def encrypt(plaintext) when is_binary(plaintext) do
    key = key()
    iv = :crypto.strong_rand_bytes(@iv_length)

    {ciphertext, tag} =
      :crypto.crypto_one_time_aead(@cipher, key, iv, plaintext, @aad, true)

    <<@version::8, iv::binary-size(@iv_length), tag::binary-size(@tag_length), ciphertext::binary>>
  end

  def decrypt(<<@version::8, iv::binary-size(@iv_length), tag::binary-size(@tag_length), ciphertext::binary>>) do
    key = key()

    case :crypto.crypto_one_time_aead(@cipher, key, iv, ciphertext, @aad, tag, false) do
      :error -> {:error, :invalid}
      plaintext -> {:ok, plaintext}
    end
  end

  def decrypt(_), do: {:error, :invalid}

  defp key do
    case :persistent_term.get({__MODULE__, :key}, :missing) do
      :missing ->
        derived_key = derive_key()
        :persistent_term.put({__MODULE__, :key}, derived_key)
        derived_key

      derived_key ->
        derived_key
    end
  end

  defp derive_key do
    base_secret =
      System.get_env("SYSTEM_SETTINGS_ENCRYPTION_KEY")
      |> presence()
      |> case do
        nil -> application_secret_key_base()
        key -> key
      end ||
        raise "secret_key_base is missing, cannot encrypt system settings"

    Plug.Crypto.KeyGenerator.generate(base_secret, @salt, iterations: @iterations, length: @key_length)
  end

  defp application_secret_key_base do
    Application.get_env(:operately, OperatelyWeb.Endpoint, [])
    |> Keyword.get(:secret_key_base)
  end

  defp presence(value) when value in [nil, ""], do: nil
  defp presence(value), do: value
end
