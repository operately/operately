defmodule Operately.TenetsTest do
  use Operately.DataCase

  alias Operately.Tenets

  describe "tenets" do
    alias Operately.Tenets.Tenet

    import Operately.TenetsFixtures

    @invalid_attrs %{description: nil, name: nil}

    test "list_tenets/0 returns all tenets" do
      tenet = tenet_fixture()
      assert Tenets.list_tenets() == [tenet]
    end

    test "get_tenet!/1 returns the tenet with given id" do
      tenet = tenet_fixture()
      assert Tenets.get_tenet!(tenet.id) == tenet
    end

    test "create_tenet/1 with valid data creates a tenet" do
      valid_attrs = %{description: "some description", name: "some name"}

      assert {:ok, %Tenet{} = tenet} = Tenets.create_tenet(valid_attrs)
      assert tenet.description == "some description"
      assert tenet.name == "some name"
    end

    test "create_tenet/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Tenets.create_tenet(@invalid_attrs)
    end

    test "update_tenet/2 with valid data updates the tenet" do
      tenet = tenet_fixture()
      update_attrs = %{description: "some updated description", name: "some updated name"}

      assert {:ok, %Tenet{} = tenet} = Tenets.update_tenet(tenet, update_attrs)
      assert tenet.description == "some updated description"
      assert tenet.name == "some updated name"
    end

    test "update_tenet/2 with invalid data returns error changeset" do
      tenet = tenet_fixture()
      assert {:error, %Ecto.Changeset{}} = Tenets.update_tenet(tenet, @invalid_attrs)
      assert tenet == Tenets.get_tenet!(tenet.id)
    end

    test "delete_tenet/1 deletes the tenet" do
      tenet = tenet_fixture()
      assert {:ok, %Tenet{}} = Tenets.delete_tenet(tenet)
      assert_raise Ecto.NoResultsError, fn -> Tenets.get_tenet!(tenet.id) end
    end

    test "change_tenet/1 returns a tenet changeset" do
      tenet = tenet_fixture()
      assert %Ecto.Changeset{} = Tenets.change_tenet(tenet)
    end
  end
end
