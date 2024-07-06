defmodule Operately.Companies.ShortId do
  @moduledoc """
  Short ID generation for companies. Short id is stored as a bigint
  in the database, but is represented as a base32 string in the API.
  """

  @min_short_id 1024 # values below this are less than 3 characters in base32
  @max_increment 317
  @min_increment 23
  @max_64_bit 18446744073709551615

  alias Operately.Repo
  alias Operately.Companies.Company

  def generate() do
    start = Repo.aggregate(Company, :max, :short_id) || @min_short_id
    gen_next(start)
  end

  @spec encode!(any) :: String.t()
  def encode!(int), do: encode(int) |> elem(1)

  @spec encode(Number.t()) :: {:ok, String.t()} | :error
  def encode(int), do: {:ok, "0" <> __MODULE__.Base32.encode(int)}

  def decode(str) do
    if String.starts_with?(str, "0") do
      __MODULE__.Base32.decode(String.slice(str, 1..-1))
    else
      :error
    end
  end

  defp gen_next(prev) do
    next = prev + @min_increment + :rand.uniform(@max_increment - @min_increment)
    next = Integer.mod(next, @max_64_bit)

    if taken?(next) do
      gen_next(next)
    else
      next
    end
  end

  defp taken?(short_id) do
    import Ecto.Query
    Repo.exists?(from c in Company, where: c.short_id == ^short_id)
  end

  defmodule Base32 do
    use CustomBase, 'abcdefghijklmnopqrstuv0123456789'
  end
end
