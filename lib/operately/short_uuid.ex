defmodule Operately.ShortUuid do
  @moduledoc """
  A module for generating short UUIDs, from canonical UUID-v4s.
  The short UUIDs are encoded with an URL safe base62 encoding,
  which reduces the length of the UUID from 36 characters to 
  22 characters.
  """

  @doc """
  Generates a new short-encoded UUID. Mostly used for testing.
  """
  def generate() do 
    id = Ecto.UUID.generate() 
    encode!(id)
  end

  @spec encode!(Ecto.UUID.t()) :: String.t()
  def encode!(uuid) do
    case encode(uuid) do
      {:ok, short_uuid} -> short_uuid
      {:error, reason} -> raise __MODULE__.ShortUuidError, reason
    end
  end

  @spec decode!(String.t()) :: Ecto.UUID.t()
  def decode!(short_uuid) do
    case decode(short_uuid) do
      {:ok, uuid} -> uuid
      {:error, reason} -> raise __MODULE__.ShortUuidError, reason
    end
  end

  @spec encode(Ecto.UUID.t()) :: {:ok, String.t()} | {:error, String.t()}
  def encode(uuid) do
    case Ecto.UUID.dump(uuid) do
      {:ok, binary} -> 
        {:ok, binary |> :binary.decode_unsigned() |> __MODULE__.Base62.encode()}
      :error -> {:error, "Invalid UUID"}
    end
  end

  @spec decode(String.t()) :: {:ok, Ecto.UUID.t()} | {:error, String.t()}
  def decode(short_uuid) do
    if String.length(short_uuid) <= 22 do
      case __MODULE__.Base62.decode(short_uuid) do 
        {:ok, number} -> 
          bits = number |> :binary.encode_unsigned() 
          pad = 128 - bit_size(bits)
          bits = <<0::size(pad)>> <> bits

          Ecto.UUID.load(bits)
        :error -> {:error, "Invalid short UUID"}
      end
    else
      {:error, "Invalid short UUID"}
    end
  end

  defmodule Base62 do
    use CustomBase, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  end

  defmodule ShortUuidError do
    defexception message: "Invalid UUID"
  end
end
