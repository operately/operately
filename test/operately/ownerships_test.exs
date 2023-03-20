defmodule Operately.OwnershipsTest do
  use Operately.DataCase

  alias Operately.Ownerships

  describe "ownerships" do
    alias Operately.Ownerships.Ownership

    import Operately.OwnershipsFixtures

    @invalid_attrs %{person_id: nil, target: nil, target_type: nil}

    test "list_ownerships/0 returns all ownerships" do
      ownership = ownership_fixture()
      assert Ownerships.list_ownerships() == [ownership]
    end

    test "get_ownership!/1 returns the ownership with given id" do
      ownership = ownership_fixture()
      assert Ownerships.get_ownership!(ownership.id) == ownership
    end

    test "create_ownership/1 with valid data creates a ownership" do
      valid_attrs = %{person_id: "some person_id", target: "some target", target_type: :objective}

      assert {:ok, %Ownership{} = ownership} = Ownerships.create_ownership(valid_attrs)
      assert ownership.person_id == "some person_id"
      assert ownership.target == "some target"
      assert ownership.target_type == :objective
    end

    test "create_ownership/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Ownerships.create_ownership(@invalid_attrs)
    end

    test "update_ownership/2 with valid data updates the ownership" do
      ownership = ownership_fixture()
      update_attrs = %{person_id: "some updated person_id", target: "some updated target", target_type: :tenet}

      assert {:ok, %Ownership{} = ownership} = Ownerships.update_ownership(ownership, update_attrs)
      assert ownership.person_id == "some updated person_id"
      assert ownership.target == "some updated target"
      assert ownership.target_type == :tenet
    end

    test "update_ownership/2 with invalid data returns error changeset" do
      ownership = ownership_fixture()
      assert {:error, %Ecto.Changeset{}} = Ownerships.update_ownership(ownership, @invalid_attrs)
      assert ownership == Ownerships.get_ownership!(ownership.id)
    end

    test "delete_ownership/1 deletes the ownership" do
      ownership = ownership_fixture()
      assert {:ok, %Ownership{}} = Ownerships.delete_ownership(ownership)
      assert_raise Ecto.NoResultsError, fn -> Ownerships.get_ownership!(ownership.id) end
    end

    test "change_ownership/1 returns a ownership changeset" do
      ownership = ownership_fixture()
      assert %Ecto.Changeset{} = Ownerships.change_ownership(ownership)
    end
  end
end
