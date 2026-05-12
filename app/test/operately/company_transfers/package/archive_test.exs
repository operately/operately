defmodule Operately.CompanyTransfers.Package.ArchiveTest do
  use ExUnit.Case, async: true

  alias Operately.CompanyTransfers.Package.Archive

  test "extract!/3 accepts a ZIP that contains a subset of the declared file entries" do
    zip_path = temp_path("archive-subset.zip")
    extract_dir = temp_path("archive-subset-extract")

    on_exit(fn -> cleanup_paths([zip_path, extract_dir]) end)

    Archive.create!(zip_path, [%{path: "present.txt", content: "hello"}])

    extracted = Archive.extract!(zip_path, extract_dir, ["present.txt", "missing.txt"])

    assert length(extracted) == 1
    assert Path.join(extract_dir, "present.txt") in extracted
    refute Path.join(extract_dir, "missing.txt") in extracted
  end

  defp temp_path(name) do
    Path.join(System.tmp_dir!(), "#{System.unique_integer([:positive])}-#{name}")
  end

  defp cleanup_paths(paths) do
    Enum.each(paths, fn path ->
      if File.exists?(path), do: File.rm_rf!(path)
    end)
  end
end
