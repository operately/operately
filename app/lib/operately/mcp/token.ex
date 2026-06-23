defmodule Operately.Mcp.Token do
  @hash_algorithm :sha256
  @rand_size 32

  def generate(prefix) when is_binary(prefix) do
    prefix <> Base.url_encode64(:crypto.strong_rand_bytes(@rand_size), padding: false)
  end

  def hash(raw_token) when is_binary(raw_token) do
    :crypto.hash(@hash_algorithm, raw_token)
  end

  def now do
    DateTime.utc_now() |> DateTime.truncate(:second)
  end

  def expires_in(amount, unit) do
    now() |> DateTime.add(amount, unit)
  end

  def expired?(nil), do: true

  def expired?(%DateTime{} = expires_at) do
    DateTime.compare(expires_at, now()) != :gt
  end
end
