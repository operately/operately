defmodule Operately.OkrsTest do
  use Operately.DataCase

  alias Operately.Okrs

  describe "objectives" do
    alias Operately.Okrs.Objective

    import Operately.OkrsFixtures

    @invalid_attrs %{description: nil, name: nil}

    test "list_objectives/0 returns all objectives" do
      objective = objective_fixture()
      assert Okrs.list_objectives() == [objective]
    end

    test "get_objective!/1 returns the objective with given id" do
      objective = objective_fixture()
      assert Okrs.get_objective!(objective.id) == objective
    end

    test "create_objective/1 with valid data creates a objective" do
      valid_attrs = %{description: "some description", name: "some name"}

      assert {:ok, %Objective{} = objective} = Okrs.create_objective(valid_attrs)
      assert objective.description == "some description"
      assert objective.name == "some name"
    end

    test "create_objective/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Okrs.create_objective(@invalid_attrs)
    end

    test "update_objective/2 with valid data updates the objective" do
      objective = objective_fixture()
      update_attrs = %{description: "some updated description", name: "some updated name"}

      assert {:ok, %Objective{} = objective} = Okrs.update_objective(objective, update_attrs)
      assert objective.description == "some updated description"
      assert objective.name == "some updated name"
    end

    test "update_objective/2 with invalid data returns error changeset" do
      objective = objective_fixture()
      assert {:error, %Ecto.Changeset{}} = Okrs.update_objective(objective, @invalid_attrs)
      assert objective == Okrs.get_objective!(objective.id)
    end

    test "delete_objective/1 deletes the objective" do
      objective = objective_fixture()
      assert {:ok, %Objective{}} = Okrs.delete_objective(objective)
      assert_raise Ecto.NoResultsError, fn -> Okrs.get_objective!(objective.id) end
    end

    test "change_objective/1 returns a objective changeset" do
      objective = objective_fixture()
      assert %Ecto.Changeset{} = Okrs.change_objective(objective)
    end
  end
end
