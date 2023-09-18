defmodule Operately.BlobsTest do
  use Operately.DataCase

  alias Operately.Blobs

  describe "blobs" do
    alias Operately.Blobs.Blob

    import Operately.BlobsFixtures

    @invalid_attrs %{filename: nil, status: nil}

    test "list_blobs/0 returns all blobs" do
      blob = blob_fixture()
      assert Blobs.list_blobs() == [blob]
    end

    test "get_blob!/1 returns the blob with given id" do
      blob = blob_fixture()
      assert Blobs.get_blob!(blob.id) == blob
    end

    test "create_blob/1 with valid data creates a blob" do
      valid_attrs = %{filename: "some filename", status: :pending}

      assert {:ok, %Blob{} = blob} = Blobs.create_blob(valid_attrs)
      assert blob.filename == "some filename"
      assert blob.status == :pending
    end

    test "create_blob/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Blobs.create_blob(@invalid_attrs)
    end

    test "update_blob/2 with valid data updates the blob" do
      blob = blob_fixture()
      update_attrs = %{filename: "some updated filename", status: :uploaded}

      assert {:ok, %Blob{} = blob} = Blobs.update_blob(blob, update_attrs)
      assert blob.filename == "some updated filename"
      assert blob.status == :uploaded
    end

    test "update_blob/2 with invalid data returns error changeset" do
      blob = blob_fixture()
      assert {:error, %Ecto.Changeset{}} = Blobs.update_blob(blob, @invalid_attrs)
      assert blob == Blobs.get_blob!(blob.id)
    end

    test "delete_blob/1 deletes the blob" do
      blob = blob_fixture()
      assert {:ok, %Blob{}} = Blobs.delete_blob(blob)
      assert_raise Ecto.NoResultsError, fn -> Blobs.get_blob!(blob.id) end
    end

    test "change_blob/1 returns a blob changeset" do
      blob = blob_fixture()
      assert %Ecto.Changeset{} = Blobs.change_blob(blob)
    end
  end
end
