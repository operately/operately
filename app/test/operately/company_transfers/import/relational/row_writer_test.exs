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

  describe "insert_row/2" do
    test "inserts a row through its Ecto schema" do
      id = Ecto.UUID.generate()
      timestamp = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

      assert :ok =
               RowWriter.insert_row(
                 "companies",
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

    test "rejects row keys outside the schema fields" do
      id = Ecto.UUID.generate()
      timestamp = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

      assert {:error, {:unknown_columns, "companies", unknown_columns}} =
               RowWriter.insert_row(
                 "companies",
                 %{
                   "id" => id,
                   "name" => "Only Name Should Persist",
                   "nonexistent_field" => "should not be accepted",
                   "inserted_at" => NaiveDateTime.to_iso8601(timestamp),
                   "updated_at" => NaiveDateTime.to_iso8601(timestamp),
                   ~s(name", mission = 'pwned) => "malicious-key"
                 }
               )

      assert "nonexistent_field" in unknown_columns
      assert ~s(name", mission = 'pwned) in unknown_columns
      refute Repo.get(Company, id)
    end

    test "rejects unknown tables and schema-qualified names" do
      assert {:error, {:table_not_importable, "nonexistent_table"}} =
               RowWriter.insert_row("nonexistent_table", %{"id" => Ecto.UUID.generate()})

      assert {:error, {:table_not_importable, "public.companies"}} =
               RowWriter.insert_row("public.companies", %{"id" => Ecto.UUID.generate()})

      assert {:error, {:table_not_importable, "companies; DROP TABLE people; --"}} =
               RowWriter.insert_row("companies; DROP TABLE people; --", %{"id" => Ecto.UUID.generate()})
    end

    test "rejects excluded schema-backed tables" do
      assert {:error, {:table_not_importable, "api_tokens"}} =
               RowWriter.insert_row(
                 "api_tokens",
                 %{"id" => Ecto.UUID.generate(), "token_hash" => "abc"}
               )

      assert {:error, {:table_not_importable, "invite_links"}} =
               RowWriter.insert_row(
                 "invite_links",
                 %{"id" => Ecto.UUID.generate(), "token" => String.duplicate("a", 32)}
               )
    end

    test "rejects accounts because they are handled by account resolution" do
      assert {:error, {:table_not_importable, "accounts"}} =
               RowWriter.insert_row(
                 "accounts",
                 %{"id" => Ecto.UUID.generate(), "email" => "person@example.com", "full_name" => "Person"}
               )
    end

    test "rejects unknown columns" do
      assert {:error, {:unknown_columns, "companies", ["nonexistent_column"]}} =
               RowWriter.insert_row("companies", %{"nonexistent_column" => "x"})
    end

    test "rejects empty rows" do
      assert {:error, {:empty_columns, "companies"}} =
               RowWriter.insert_row("companies", %{})
    end

    test "returns a cast error for invalid field values" do
      assert {:error, {:invalid_value, "companies", "inserted_at", _reason}} =
               RowWriter.insert_row(
                 "companies",
                 %{"id" => Ecto.UUID.generate(), "inserted_at" => "not-a-timestamp"}
               )
    end

    test "casts enum fields", ctx do
      id = Ecto.UUID.generate()
      timestamp = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

      assert :ok =
               RowWriter.insert_row(
                 "blobs",
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

  describe "update_row/2" do
    test "updates columns present in the row", ctx do
      original = ctx.company

      assert :ok =
               RowWriter.update_row(
                 "companies",
                 %{
                   "id" => original.id,
                   "name" => "Updated Name"
                 }
               )

      company = Repo.get!(Company, original.id)

      assert company.name == "Updated Name"
      assert company.mission == original.mission
    end

    test "rejects row keys outside the schema fields", ctx do
      assert {:error, {:unknown_columns, "companies", unknown_columns}} =
               RowWriter.update_row(
                 "companies",
                 %{
                   "id" => ctx.company.id,
                   "name" => "Visible Change",
                   "nonexistent_field" => "hidden change",
                   ~s(name", mission = 'pwned) => "malicious-key"
                 }
               )

      assert "nonexistent_field" in unknown_columns
      assert Repo.get!(Company, ctx.company.id).name == ctx.company.name
    end

    test "rejects update rows without a binary id" do
      assert {:error, {:invalid_update_row, "companies"}} =
               RowWriter.update_row("companies", %{"name" => "missing id"})

      assert {:error, {:invalid_update_row, "companies"}} =
               RowWriter.update_row("companies", %{"id" => 123, "name" => "x"})
    end

    test "returns an error when the update row is missing" do
      fake_id = Ecto.UUID.generate()

      assert {:error, {:missing_update_row, "companies", ^fake_id}} =
               RowWriter.update_row("companies", %{"id" => fake_id, "name" => "Should Not Exist"})
    end

    test "updates soft-deleted rows", ctx do
      ctx =
        ctx
        |> Factory.add_space(:space)
        |> Factory.add_project(:project, :space)

      {:ok, deleted_project} = Repo.soft_delete(ctx.project)

      refute Repo.get(Project, deleted_project.id)

      assert :ok =
               RowWriter.update_row(
                 "projects",
                 %{
                   "id" => deleted_project.id,
                   "name" => "Updated Archived Project"
                 }
               )

      refute Repo.get(Project, deleted_project.id)

      project = Repo.get!(Project, deleted_project.id, with_deleted: true)

      assert project.name == "Updated Archived Project"
      assert project.deleted_at == deleted_project.deleted_at
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
