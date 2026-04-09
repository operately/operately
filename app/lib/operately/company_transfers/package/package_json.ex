defmodule Operately.CompanyTransfers.Package.PackageJson do
  alias Operately.CompanyTransfers.Package.Hashing

  def encode!(payload) when is_map(payload) or is_list(payload) do
    Jason.encode!(payload, pretty: true)
  end

  def write!(path, payload) when is_binary(path) do
    encoded = encode!(payload)

    File.mkdir_p!(Path.dirname(path))
    File.write!(path, encoded)

    %{
      path: path,
      size_bytes: byte_size(encoded),
      sha256: Hashing.sha256(encoded)
    }
  end

  def read!(path) when is_binary(path) do
    path
    |> File.read!()
    |> Jason.decode!()
  end
end
