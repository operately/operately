defmodule Operately.BlobsTest do
  use Operately.DataCase

  alias Operately.Blobs

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  setup do
    company = company_fixture()
    person = person_fixture(company_id: company.id)

    {:ok, company: company, person: person}
  end

  describe "blobs" do
    alias Operately.Blobs.Blob

    import Operately.BlobsFixtures

    @invalid_attrs %{filename: nil, status: nil, storage_type: nil}

    test "list_blobs/0 returns all blobs", ctx do
      blob = blob_fixture(company_id: ctx.company.id, author_id: ctx.person.id)
      assert Blobs.list_blobs() == [blob]
    end

    test "get_blob!/1 returns the blob with given id", ctx do
      blob = blob_fixture(company_id: ctx.company.id, author_id: ctx.person.id)
      assert Blobs.get_blob!(blob.id) == blob
    end

    test "create_blob/1 with valid data creates a blob", ctx do
      valid_attrs = %{filename: "some filename", status: :pending, company_id: ctx.company.id, author_id: ctx.person.id, storage_type: :local}

      assert {:ok, %Blob{} = blob} = Blobs.create_blob(valid_attrs)
      assert blob.filename == "some filename"
      assert blob.status == :pending
      assert blob.storage_type == :local
    end

    test "create_blob/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Blobs.create_blob(@invalid_attrs)
    end

    test "update_blob/2 with valid data updates the blob", ctx do
      blob = blob_fixture(company_id: ctx.company.id, author_id: ctx.person.id)
      update_attrs = %{filename: "some updated filename", status: :uploaded, storage_type: :local}

      assert {:ok, %Blob{} = blob} = Blobs.update_blob(blob, update_attrs)
      assert blob.filename == "some updated filename"
      assert blob.status == :uploaded
      assert blob.storage_type == :local
    end

    test "update_blob/2 with invalid data returns error changeset", ctx do
      blob = blob_fixture(company_id: ctx.company.id, author_id: ctx.person.id)
      assert {:error, %Ecto.Changeset{}} = Blobs.update_blob(blob, @invalid_attrs)
      assert blob == Blobs.get_blob!(blob.id)
    end

    test "delete_blob/1 deletes the blob", ctx do
      blob = blob_fixture(company_id: ctx.company.id, author_id: ctx.person.id)
      assert {:ok, %Blob{}} = Blobs.delete_blob(blob)
      assert_raise Ecto.NoResultsError, fn -> Blobs.get_blob!(blob.id) end
    end

    test "change_blob/1 returns a blob changeset", ctx do
      blob = blob_fixture(company_id: ctx.company.id, author_id: ctx.person.id)
      assert %Ecto.Changeset{} = Blobs.change_blob(blob)
    end
  end
end
