defmodule Operately.CompanyTransfers.Package.Hashing do
  def sha256(data) when is_binary(data) do
    :crypto.hash(:sha256, data)
    |> Base.encode16(case: :lower)
  end

  def sha256_file!(path) when is_binary(path) do
    path
    |> File.read!()
    |> sha256()
  end
end
