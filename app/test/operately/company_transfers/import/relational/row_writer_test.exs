defmodule Operately.CompanyTransfers.Import.Relational.RowWriterTest do
  use Operately.DataCase

  alias Operately.Blobs.Blob
  alias Operately.Companies.Company
  alias Operately.CompanyTransfers.Import.Relational.RowWriter
  alias Operately.People.Person
  alias Operately.Projects.Project

  setup do
    {:ok, Factory.setup(%{})}
  end

  describe "insert_row/3" do
    test "inserts a row through its Ecto schema" do
      id = Ecto.UUID.generate()
      timestamp = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

      assert :ok =
               RowWriter.insert_row(
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

    test "treats row values as data instead of executable SQL" do
      id = Ecto.UUID.generate()
      timestamp = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
      people_count_before = Repo.aggregate(Person, :count, :id)
      malicious_name = "Injected'); DELETE FROM people; --"

      assert :ok =
               RowWriter.insert_row(
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

    test "rejects row keys outside the package metadata" do
      id = Ecto.UUID.generate()
      timestamp = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

      assert {:error, {:unknown_row_keys, "companies", extra_keys}} =
               RowWriter.insert_row(
                 "companies",
                 ["id", "name", "inserted_at", "updated_at"],
                 %{
                   "id" => id,
                   "name" => "Only Name Should Persist",
                   "mission" => "should not be accepted",
                   "inserted_at" => NaiveDateTime.to_iso8601(timestamp),
                   "updated_at" => NaiveDateTime.to_iso8601(timestamp),
                   ~s(name", mission = 'pwned) => "malicious-key"
                 }
               )

      assert "mission" in extra_keys
      assert ~s(name", mission = 'pwned) in extra_keys
      refute Repo.get(Company, id)
    end

    test "rejects unknown tables and schema-qualified names" do
      assert {:error, {:unknown_table, "nonexistent_table"}} =
               RowWriter.insert_row("nonexistent_table", ["id"], %{"id" => Ecto.UUID.generate()})

      assert {:error, {:unknown_table, "public.companies"}} =
               RowWriter.insert_row("public.companies", ["id"], %{"id" => Ecto.UUID.generate()})

      assert {:error, {:unknown_table, "companies; DROP TABLE people; --"}} =
               RowWriter.insert_row("companies; DROP TABLE people; --", ["id"], %{"id" => Ecto.UUID.generate()})
    end

    test "rejects unknown columns" do
      assert {:error, {:unknown_columns, "companies", ["nonexistent_column"]}} =
               RowWriter.insert_row("companies", ["nonexistent_column"], %{"nonexistent_column" => "x"})
    end

    test "rejects empty columns" do
      assert {:error, {:empty_columns, "companies"}} =
               RowWriter.insert_row("companies", [], %{"id" => Ecto.UUID.generate()})
    end

    test "returns a cast error for invalid field values" do
      assert {:error, {:invalid_value, "companies", "inserted_at", _reason}} =
               RowWriter.insert_row(
                 "companies",
                 ["id", "inserted_at"],
                 %{"id" => Ecto.UUID.generate(), "inserted_at" => "not-a-timestamp"}
               )
    end

    test "casts enum fields", ctx do
      id = Ecto.UUID.generate()
      timestamp = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

      assert :ok =
               RowWriter.insert_row(
                 "blobs",
                 [
                   "id",
                   "company_id",
                   "author_id",
                   "purpose",
                   "status",
                   "storage_type",
                   "filename",
                   "size",
                   "content_type",
                   "inserted_at",
                   "updated_at"
                 ],
                 %{
                   "id" => id,
                   "company_id" => ctx.company.id,
                   "author_id" => ctx.creator.id,
                   "purpose" => "company_file",
                   "status" => "uploaded",
                   "storage_type" => "local",
                   "filename" => "imported.txt",
                   "size" => 12,
                   "content_type" => "text/plain",
                   "inserted_at" => NaiveDateTime.to_iso8601(timestamp),
                   "updated_at" => NaiveDateTime.to_iso8601(timestamp)
                 }
               )

      blob = Repo.get!(Blob, id)

      assert blob.purpose == :company_file
      assert blob.status == :uploaded
      assert blob.storage_type == :local
    end
  end

  describe "update_row/3" do
    test "updates only listed columns", ctx do
      original = ctx.company

      assert :ok =
               RowWriter.update_row(
                 "companies",
                 ["name"],
                 %{
                   "id" => original.id,
                   "name" => "Updated Name"
                 }
               )

      company = Repo.get!(Company, original.id)

      assert company.name == "Updated Name"
      assert company.mission == original.mission
    end

    test "rejects extra update row keys", ctx do
      assert {:error, {:unknown_row_keys, "companies", extra_keys}} =
               RowWriter.update_row(
                 "companies",
                 ["name"],
                 %{
                   "id" => ctx.company.id,
                   "name" => "Visible Change",
                   "mission" => "hidden change",
                   ~s(name", mission = 'pwned) => "malicious-key"
                 }
               )

      assert "mission" in extra_keys
      assert Repo.get!(Company, ctx.company.id).name == ctx.company.name
    end

    test "rejects update rows without a binary id" do
      assert {:error, {:invalid_update_row, "companies"}} =
               RowWriter.update_row("companies", ["name"], %{"name" => "missing id"})

      assert {:error, {:invalid_update_row, "companies"}} =
               RowWriter.update_row("companies", ["name"], %{"id" => 123, "name" => "x"})
    end

    test "returns an error when the update row is missing" do
      fake_id = Ecto.UUID.generate()

      assert {:error, {:missing_update_row, "companies", ^fake_id}} =
               RowWriter.update_row("companies", ["name"], %{"id" => fake_id, "name" => "Should Not Exist"})
    end

    test "casts maps and embeds", ctx do
      ctx =
        ctx
        |> Factory.add_space(:space)
        |> Factory.add_project(:project, :space)

      timeframe = %{
        "type" => "year",
        "start_date" => "2026-01-01",
        "end_date" => "2026-12-31"
      }

      task_statuses = [
        %{
          "id" => "todo",
          "label" => "Todo",
          "color" => "gray",
          "index" => 0,
          "value" => "todo",
          "closed" => false
        },
        %{
          "id" => "done",
          "label" => "Done",
          "color" => "green",
          "index" => 1,
          "value" => "done",
          "closed" => true
        }
      ]

      assert :ok =
               RowWriter.update_row(
                 "projects",
                 ["description", "health", "timeframe", "task_statuses"],
                 %{
                   "id" => ctx.project.id,
                   "description" => %{"type" => "doc", "content" => []},
                   "health" => "at_risk",
                   "timeframe" => timeframe,
                   "task_statuses" => task_statuses
                 }
               )

      project = Repo.get!(Project, ctx.project.id)

      assert project.description == %{"type" => "doc", "content" => []}
      assert project.health == :at_risk
      assert project.timeframe.type == "year"
      assert project.timeframe.start_date == ~D[2026-01-01]
      assert Enum.map(project.task_statuses, & &1.color) == [:gray, :green]
    end
  end
end
