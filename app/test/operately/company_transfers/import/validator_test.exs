defmodule Operately.CompanyTransfers.Import.ValidatorTest do
  use Operately.DataCase

  alias Operately.CompanyTransfers.Import.{Package, Validator}
  alias Operately.Repo

  setup do
    {:ok, Factory.setup(%{})}
  end

  test "validate/1 accepts a compatible minimal package" do
    assert :ok = Validator.validate(build_package())
  end

  test "validate/1 rejects unsupported package formats" do
    package =
      build_package(%{
        manifest: %{
          "package_format_version" => 99
        }
      })

    assert {:error, errors} = Validator.validate(package)
    assert find_error(errors, "unsupported_package_format")["details"]["actual"] == 99
  end

  test "validate/1 rejects unsupported package slices" do
    package =
      build_package(%{
        manifest: %{
          "slice" => "full_migration"
        }
      })

    assert {:error, errors} = Validator.validate(package)
    assert find_error(errors, "unsupported_package_slice")["details"]["actual"] == "full_migration"
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

  test "validate/1 rejects schema migration mismatches" do
    package =
      build_package(%{
        manifest: %{
          "schema_migrations" => [999_999_999]
        }
      })

    assert {:error, errors} = Validator.validate(package)
    assert find_error(errors, "schema_migration_mismatch")["details"]["actual"] == [999_999_999]
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

  test "validate/1 rejects packages with files in this slice" do
    package =
      build_package(%{
        files: [
          %{"path" => "avatars/a.png", "blob_id" => Ecto.UUID.generate()}
        ]
      })

    assert {:error, errors} = Validator.validate(package)
    assert find_error(errors, "files_not_supported_yet")["details"]["files_count"] == 1
  end

  test "validate/1 accumulates errors in check order" do
    package =
      build_package(%{
        manifest: %{
          "package_format_version" => 2,
          "slice" => "full_migration",
          "operately_version" => "0.0.0-test",
          "schema_migrations" => [999_999_999]
        },
        tables: [],
        files: [%{"path" => "files.zip"}]
      })

    assert {:error, errors} = Validator.validate(package)

    assert Enum.map(errors, & &1["code"]) == [
             "unsupported_package_format",
             "unsupported_package_slice",
             "operately_version_mismatch",
             "schema_migration_mismatch",
             "invalid_company_count",
             "files_not_supported_yet"
           ]
  end

  defp build_package(overrides \\ %{}) do
    manifest =
      %{
        "package_format_version" => 1,
        "slice" => "relational_minimal",
        "operately_version" => Operately.version(),
        "schema_migrations" => schema_migrations()
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

  defp schema_migrations do
    Repo.query!("SELECT version FROM schema_migrations ORDER BY version", []).rows
    |> Enum.map(fn [version] -> version end)
  end

  defp find_error(errors, code) do
    Enum.find(errors, &(&1["code"] == code))
  end

  defp unique_short_id do
    3_000_000 + System.unique_integer([:positive])
  end
end
