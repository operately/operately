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

    @invalid_attrs %{filename: nil, status: nil}

    test "list_blobs/0 returns all blobs", ctx do
      blob = blob_fixture(company_id: ctx.company.id, author_id: ctx.person.id)
      assert Blobs.list_blobs() == [blob]
    end

    test "get_blob!/1 returns the blob with given id", ctx do
      blob = blob_fixture(company_id: ctx.company.id, author_id: ctx.person.id)
      assert Blobs.get_blob!(blob.id) == blob
    end

    test "create_blob/1 with valid data creates a blob", ctx do
      valid_attrs = %{
        filename: "some filename",
        status: :pending,
        company_id: ctx.company.id,
        author_id: ctx.person.id,
        storage_type: :local,
        size: 1024,
        content_type: "application/pdf"
      }

      assert {:ok, %Blob{} = blob} = Blobs.create_blob(valid_attrs)
      assert blob.filename == "some filename"
      assert blob.status == :pending
    end

    test "create_blob/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Blobs.create_blob(@invalid_attrs)
    end

    test "update_blob/2 with valid data updates the blob", ctx do
      blob = blob_fixture(company_id: ctx.company.id, author_id: ctx.person.id)
      update_attrs = %{filename: "some updated filename", status: :uploaded}

      assert {:ok, %Blob{} = blob} = Blobs.update_blob(blob, update_attrs)
      assert blob.filename == "some updated filename"
      assert blob.status == :uploaded
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

  describe "cache-friendly S3 signed URLs" do
    import Operately.BlobsFixtures

    setup do
      System.put_env("OPERATELY_STORAGE_S3_HOST", "localhost")
      System.put_env("OPERATELY_STORAGE_S3_SCHEME", "http")
      System.put_env("OPERATELY_STORAGE_S3_PORT", "9000")
      System.put_env("OPERATELY_STORAGE_S3_BUCKET", "test-bucket")
      System.put_env("OPERATELY_STORAGE_S3_REGION", "us-east-1")
      System.put_env("OPERATELY_STORAGE_S3_ACCESS_KEY_ID", "test-access-key")
      System.put_env("OPERATELY_STORAGE_S3_SECRET_ACCESS_KEY", "test-secret-key")

      on_exit(fn ->
        System.delete_env("OPERATELY_STORAGE_S3_HOST")
        System.delete_env("OPERATELY_STORAGE_S3_SCHEME")
        System.delete_env("OPERATELY_STORAGE_S3_PORT")
        System.delete_env("OPERATELY_STORAGE_S3_BUCKET")
        System.delete_env("OPERATELY_STORAGE_S3_REGION")
        System.delete_env("OPERATELY_STORAGE_S3_ACCESS_KEY_ID")
        System.delete_env("OPERATELY_STORAGE_S3_SECRET_ACCESS_KEY")
      end)

      :ok
    end

    test "get_signed_get_url generates consistent URLs within same 2-hour window for S3", ctx do
      blob = blob_fixture(company_id: ctx.company.id, author_id: ctx.person.id)
      blob = Map.put(blob, :storage_type, :s3)

      # Generate multiple URLs within a short time period
      {:ok, url1} = Blobs.get_signed_get_url(blob, "inline")
      # Small delay
      Process.sleep(1000)
      {:ok, url2} = Blobs.get_signed_get_url(blob, "inline")

      # URLs should be identical due to time rounding
      assert url1 == url2
    end
  end

  describe "cache-friendly local signed URLs" do
    import Operately.BlobsFixtures

    test "get_signed_get_url generates consistent URLs within same 2-hour window for local storage", ctx do
      blob = blob_fixture(company_id: ctx.company.id, author_id: ctx.person.id)
      blob = Map.put(blob, :storage_type, :local)

      # Generate multiple URLs within a short time period
      {:ok, url1} = Blobs.get_signed_get_url(blob, "inline")
      # Small delay
      Process.sleep(1000)
      {:ok, url2} = Blobs.get_signed_get_url(blob, "inline")

      # URLs should be identical due to time rounding
      assert url1 == url2
    end
  end
end
