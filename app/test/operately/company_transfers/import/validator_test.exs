defmodule Operately.CompanyTransfers.Import.ValidatorTest do
  use Operately.DataCase

  alias Operately.CompanyTransfers.Import.{Package, Validator}
  alias Operately.CompanyTransfers.Package.Limits

  setup do
    {:ok, Factory.setup(%{})}
  end

  test "validate/1 accepts a compatible minimal package" do
    assert :ok = Validator.validate(build_package())
  end

  test "validate/1 rejects version mismatches" do
    package =
      build_package(%{
        manifest: %{
          "operately_version" => "0.0.0-test"
        }
      })

    assert {:error, errors} = Validator.validate(package)
    assert find_error(errors, "operately_version_mismatch")["details"]["actual"] == "0.0.0-test"
  end

  test "validate/1 rejects packages without exactly one company row" do
    package =
      build_package(%{
        tables: [
          account_table([account_row()])
        ]
      })

    assert {:error, errors} = Validator.validate(package)
    assert find_error(errors, "invalid_company_count")["details"]["count"] == 0
  end

  test "validate/1 rejects packages that exceed configured table, row, or file limits" do
    with_package_limits([max_tables_count: 1, max_rows_count: 1, max_files_count: 0], fn ->
      package =
        build_package(%{
          manifest: %{"files_count" => 1},
          files: [
            %{"path" => "avatars/a.png", "blob_id" => Ecto.UUID.generate()}
          ]
        })

      assert {:error, errors} = Validator.validate(package)

      assert find_limit_error(errors, "max_tables_count")["details"]["actual"] == 2
      assert find_limit_error(errors, "max_rows_count")["details"]["actual"] == 2
      assert find_limit_error(errors, "max_files_count")["details"]["actual"] == 1
    end)
  end

  test "validate/1 rejects duplicate account emails after normalization" do
    package =
      build_package(%{
        tables: [
          company_table([company_row()]),
          account_table([
            account_row(id: Ecto.UUID.generate(), email: "Member@example.com"),
            account_row(id: Ecto.UUID.generate(), email: " member@example.com ")
          ])
        ]
      })

    assert {:error, errors} = Validator.validate(package)

    assert find_error(errors, "duplicate_account_emails")["details"]["emails"] == [
             "member@example.com"
           ]
  end

  test "validate/1 accepts packages with matching file metadata" do
    package =
      build_package(%{
        manifest: %{"files_count" => 1},
        files: [
          %{"path" => "avatars/a.png", "blob_id" => Ecto.UUID.generate()}
        ]
      })

    assert :ok = Validator.validate(package)
  end

  test "validate/1 rejects packages whose manifest files_count does not match package files" do
    package =
      build_package(%{
        manifest: %{"files_count" => 2},
        files: [
          %{"path" => "avatars/a.png", "blob_id" => Ecto.UUID.generate()}
        ]
      })

    assert {:error, errors} = Validator.validate(package)
    assert find_error(errors, "file_count_mismatch")["details"]["expected"] == 2
    assert find_error(errors, "file_count_mismatch")["details"]["actual"] == 1
  end

  test "validate/1 rejects invalid file entries" do
    package =
      build_package(%{
        manifest: %{"files_count" => 1},
        files: [
          %{"path" => "../avatars/a.png", "blob_id" => Ecto.UUID.generate()}
        ]
      })

    assert {:error, errors} = Validator.validate(package)
    assert find_error(errors, "invalid_file_entries")["details"]["paths"] == ["../avatars/a.png"]
  end

  test "validate/1 accumulates errors in check order" do
    package =
      build_package(%{
        manifest: %{
          "operately_version" => "0.0.0-test",
          "files_count" => 1
        },
        tables: [],
        files: [%{"path" => "files.zip"}]
      })

    assert {:error, errors} = Validator.validate(package)

    assert Enum.map(errors, & &1["code"]) == [
             "operately_version_mismatch",
             "invalid_company_count",
             "invalid_file_entries"
           ]
  end

  defp build_package(overrides \\ %{}) do
    manifest =
      %{
        "operately_version" => Operately.version()
      }
      |> Map.merge(Map.get(overrides, :manifest, %{}))

    tables = Map.get(overrides, :tables, [company_table([company_row()]), account_table([account_row()])])
    files = Map.get(overrides, :files, [])

    %Package{
      manifest: manifest,
      tables: tables,
      table_map: Map.new(tables, &{&1["name"], &1}),
      files: files
    }
  end

  defp company_table(rows) do
    %{
      "name" => "companies",
      "rows" => rows
    }
  end

  defp account_table(rows) do
    %{
      "name" => "accounts",
      "rows" => rows
    }
  end

  defp company_row(opts \\ []) do
    %{
      "id" => Keyword.get(opts, :id, Ecto.UUID.generate()),
      "short_id" => Keyword.get(opts, :short_id, unique_short_id())
    }
  end

  defp account_row(opts \\ []) do
    %{
      "id" => Keyword.get(opts, :id, Ecto.UUID.generate()),
      "email" => Keyword.get(opts, :email, "member-#{System.unique_integer([:positive])}@example.com")
    }
  end

  defp find_error(errors, code) do
    Enum.find(errors, &(&1["code"] == code))
  end

  defp find_limit_error(errors, limit) do
    Enum.find(errors, &(&1["code"] == "package_limit_exceeded" and &1["details"]["limit"] == limit))
  end

  defp with_package_limits(limits, fun) do
    original = Application.get_env(:operately, Limits)
    Application.put_env(:operately, Limits, limits)

    try do
      fun.()
    after
      if original == nil do
        Application.delete_env(:operately, Limits)
      else
        Application.put_env(:operately, Limits, original)
      end
    end
  end

  defp unique_short_id do
    3_000_000 + System.unique_integer([:positive])
  end
end
