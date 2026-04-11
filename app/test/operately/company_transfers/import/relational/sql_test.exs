defmodule Operately.CompanyTransfers.Import.Relational.SqlTest do
  use Operately.DataCase

  alias Operately.Companies.Company
  alias Operately.CompanyTransfers.Import.Relational.Sql
  alias Operately.People.Person
  alias Operately.Repo

  setup do
    {:ok, Factory.setup(%{})}
  end

  describe "insert_row!/3" do
    test "inserts a row through jsonb_populate_record" do
      id = Ecto.UUID.generate()
      timestamp = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

      Sql.insert_row!(
        "companies",
        ["id", "name", "inserted_at", "updated_at"],
        %{
          "id" => id,
          "name" => "Imported Company",
          "inserted_at" => NaiveDateTime.to_iso8601(timestamp),
          "updated_at" => NaiveDateTime.to_iso8601(timestamp)
        }
      )

      company = Repo.get!(Company, id)

      assert company.name == "Imported Company"
      assert company.inserted_at == timestamp
      assert company.updated_at == timestamp
    end

    test "treats row values as bound parameters instead of executable SQL" do
      id = Ecto.UUID.generate()
      timestamp = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
      people_count_before = Repo.aggregate(Person, :count, :id)
      malicious_name = "Injected'); DELETE FROM people; --"

      Sql.insert_row!(
        "companies",
        ["id", "name", "inserted_at", "updated_at"],
        %{
          "id" => id,
          "name" => malicious_name,
          "inserted_at" => NaiveDateTime.to_iso8601(timestamp),
          "updated_at" => NaiveDateTime.to_iso8601(timestamp)
        }
      )

      assert Repo.get!(Company, id).name == malicious_name
      assert Repo.aggregate(Person, :count, :id) == people_count_before
    end

    test "ignores extra JSON keys that are not listed in the target columns" do
      id = Ecto.UUID.generate()
      timestamp = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

      Sql.insert_row!(
        "companies",
        ["id", "name", "inserted_at", "updated_at"],
        %{
          "id" => id,
          "name" => "Only Name Should Persist",
          "mission" => "should not be inserted",
          "inserted_at" => NaiveDateTime.to_iso8601(timestamp),
          "updated_at" => NaiveDateTime.to_iso8601(timestamp),
          ~s(name", mission = 'pwned) => "malicious-key"
        }
      )

      company = Repo.get!(Company, id)

      assert company.name == "Only Name Should Persist"
      assert company.mission == nil
    end

    test "raises when the table identifier is unsafe" do
      assert_raise ArgumentError, ~r/Unsafe SQL identifier/, fn ->
        Sql.insert_row!("companies; DROP TABLE people; --", ["id"], %{"id" => Ecto.UUID.generate()})
      end
    end

    test "raises when a column identifier is unsafe" do
      assert_raise ArgumentError, ~r/Unsafe SQL identifier/, fn ->
        Sql.insert_row!("companies", ["id; DROP TABLE people; --"], %{"id; DROP TABLE people; --" => "x"})
      end
    end

    test "raises when no columns are provided" do
      assert_raise ArgumentError, ~r/Expected at least one SQL column/, fn ->
        Sql.insert_row!("companies", [], %{"id" => Ecto.UUID.generate()})
      end
    end
  end

  describe "update_row!/3" do
    test "updates only the listed columns", ctx do
      original = ctx.company

      Sql.update_row!(
        "companies",
        ["name"],
        %{
          "id" => original.id,
          "name" => "Updated Name",
          "mission" => "should be ignored"
        }
      )

      company = Repo.get!(Company, original.id)

      assert company.name == "Updated Name"
      assert company.mission == original.mission
    end

    test "treats update values as bound parameters instead of executable SQL", ctx do
      other_ctx = Factory.setup(%{})
      people_count_before = Repo.aggregate(Person, :count, :id)
      malicious_name = "Updated'); DELETE FROM people; --"

      Sql.update_row!(
        "companies",
        ["name"],
        %{
          "id" => ctx.company.id,
          "name" => malicious_name
        }
      )

      assert Repo.get!(Company, ctx.company.id).name == malicious_name
      assert Repo.get!(Company, other_ctx.company.id).name == other_ctx.company.name
      assert Repo.aggregate(Person, :count, :id) == people_count_before
    end

    test "ignores extra JSON keys that are not listed in the update columns", ctx do
      Sql.update_row!(
        "companies",
        ["name"],
        %{
          "id" => ctx.company.id,
          "name" => "Visible Change",
          "mission" => "hidden change",
          ~s(name", mission = 'pwned) => "malicious-key"
        }
      )

      company = Repo.get!(Company, ctx.company.id)

      assert company.name == "Visible Change"
      assert company.mission == ctx.company.mission
    end

    test "raises when the table identifier is unsafe", ctx do
      assert_raise ArgumentError, ~r/Unsafe SQL identifier/, fn ->
        Sql.update_row!("companies; DROP TABLE people; --", ["name"], %{"id" => ctx.company.id, "name" => "x"})
      end
    end

    test "raises when a column identifier is unsafe", ctx do
      assert_raise ArgumentError, ~r/Unsafe SQL identifier/, fn ->
        Sql.update_row!("companies", ["name; DROP TABLE people; --"], %{"id" => ctx.company.id, "name; DROP TABLE people; --" => "x"})
      end
    end

    test "raises when no columns are provided", ctx do
      assert_raise ArgumentError, ~r/Expected at least one SQL column/, fn ->
        Sql.update_row!("companies", [], %{"id" => ctx.company.id})
      end
    end

    test "raises when the update row does not include an id" do
      assert_raise ArgumentError, ~r/requires row\[\"id\"\] to be a UUID string/, fn ->
        Sql.update_row!("companies", ["name"], %{"name" => "missing id"})
      end
    end
  end

  describe "schema isolation" do
    test "cannot access tables outside public schema" do
      assert_raise ArgumentError, ~r/Unsafe SQL identifier/, fn ->
        Sql.insert_row!("information_schema.tables", ["id"], %{"id" => "x"})
      end
    end

    test "cannot use schema-qualified table names" do
      assert_raise ArgumentError, ~r/Unsafe SQL identifier/, fn ->
        Sql.insert_row!("public.companies", ["id"], %{"id" => Ecto.UUID.generate()})
      end
    end

    test "cannot use relative schema paths" do
      assert_raise ArgumentError, ~r/Unsafe SQL identifier/, fn ->
        Sql.insert_row!("../other_schema/table", ["id"], %{"id" => "x"})
      end
    end
  end

  describe "identifier edge cases" do
    test "rejects empty table name" do
      assert_raise ArgumentError, ~r/Unsafe SQL identifier/, fn ->
        Sql.insert_row!("", ["id"], %{"id" => "x"})
      end
    end

    test "rejects empty column name" do
      assert_raise ArgumentError, ~r/Unsafe SQL identifier/, fn ->
        Sql.insert_row!("companies", [""], %{"" => "x"})
      end
    end

    test "rejects table names with spaces" do
      assert_raise ArgumentError, ~r/Unsafe SQL identifier/, fn ->
        Sql.insert_row!("companies users", ["id"], %{"id" => "x"})
      end
    end

    test "rejects column names with special characters" do
      assert_raise ArgumentError, ~r/Unsafe SQL identifier/, fn ->
        Sql.insert_row!("companies", ["id@domain"], %{"id@domain" => "x"})
      end
    end

    test "rejects unicode in table names" do
      assert_raise ArgumentError, ~r/Unsafe SQL identifier/, fn ->
        Sql.insert_row!("compañies", ["id"], %{"id" => "x"})
      end
    end

    test "rejects null bytes in identifiers" do
      assert_raise ArgumentError, ~r/Unsafe SQL identifier/, fn ->
        Sql.insert_row!("companies\0", ["id"], %{"id" => "x"})
      end
    end
  end

  describe "update_row! id validation" do
    test "rejects non-string id" do
      assert_raise ArgumentError, ~r/requires row\[\"id\"\] to be a UUID string/, fn ->
        Sql.update_row!("companies", ["name"], %{"id" => 123, "name" => "x"})
      end
    end

    test "rejects nil id" do
      assert_raise ArgumentError, ~r/requires row\[\"id\"\] to be a UUID string/, fn ->
        Sql.update_row!("companies", ["name"], %{"id" => nil, "name" => "x"})
      end
    end

    test "rejects map as id" do
      assert_raise ArgumentError, ~r/requires row\[\"id\"\] to be a UUID string/, fn ->
        Sql.update_row!("companies", ["name"], %{"id" => %{}, "name" => "x"})
      end
    end
  end

  describe "error handling" do
    test "raises on non-existent table" do
      assert_raise Postgrex.Error, fn ->
        Sql.insert_row!("nonexistent_table", ["id"], %{"id" => Ecto.UUID.generate()})
      end
    end

    test "raises on non-existent column" do
      assert_raise Postgrex.Error, fn ->
        Sql.insert_row!("companies", ["nonexistent_column"], %{"nonexistent_column" => "x"})
      end
    end

    test "raises on type mismatch" do
      assert_raise Postgrex.Error, fn ->
        Sql.insert_row!(
          "companies",
          ["id", "inserted_at"],
          %{"id" => Ecto.UUID.generate(), "inserted_at" => "not-a-timestamp"}
        )
      end
    end
  end

  describe "data integrity" do
    setup do
      {:ok, Factory.setup(%{})}
    end

    test "update only affects row with matching id", ctx do
      other_ctx = Factory.setup(%{})

      Sql.update_row!(
        "companies",
        ["name"],
        %{"id" => ctx.company.id, "name" => "Changed"}
      )

      assert Repo.get!(Operately.Companies.Company, ctx.company.id).name == "Changed"
      assert Repo.get!(Operately.Companies.Company, other_ctx.company.id).name == other_ctx.company.name
    end

    test "update with non-existent id does not raise but affects 0 rows", ctx do
      fake_id = Ecto.UUID.generate()

      Sql.update_row!(
        "companies",
        ["name"],
        %{"id" => fake_id, "name" => "Should Not Exist"}
      )

      refute Repo.get(Operately.Companies.Company, fake_id)
      assert Repo.get!(Operately.Companies.Company, ctx.company.id).name == ctx.company.name
    end
  end
end
