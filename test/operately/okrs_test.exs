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

  describe "key_results" do
    alias Operately.Okrs.KeyResult

    import Operately.OkrsFixtures

    @invalid_attrs %{direction: nil, name: nil, target: nil, unit: nil}

    test "get_key_result!/1 returns the key_result with given id" do
      {_, key_result} = key_result_fixture(:with_objective, %{})

      assert Okrs.get_key_result!(key_result.id) == key_result
    end

    test "create_key_result/1 with valid data creates a key_result" do
      objective = objective_fixture()

      valid_attrs = %{
        objective_id: objective.id,
        direction: :above,
        name: "some name",
        target: 42,
        unit: :percentage
      }

      assert {:ok, %KeyResult{} = key_result} = Okrs.create_key_result(valid_attrs)
      assert key_result.direction == :above
      assert key_result.name == "some name"
      assert key_result.target == 42
      assert key_result.unit == :percentage
    end

    test "create_key_result/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Okrs.create_key_result(@invalid_attrs)
    end

    test "update_key_result/2 with valid data updates the key_result" do
      {_, key_result} = key_result_fixture(:with_objective, %{})
      update_attrs = %{direction: :below, name: "some updated name", target: 43, unit: :number}

      assert {:ok, %KeyResult{} = key_result} = Okrs.update_key_result(key_result, update_attrs)
      assert key_result.direction == :below
      assert key_result.name == "some updated name"
      assert key_result.target == 43
      assert key_result.unit == :number
    end

    test "update_key_result/2 with invalid data returns error changeset" do
      {_, key_result} = key_result_fixture(:with_objective, %{})

      assert {:error, %Ecto.Changeset{}} = Okrs.update_key_result(key_result, @invalid_attrs)
      assert key_result == Okrs.get_key_result!(key_result.id)
    end

    test "delete_key_result/1 deletes the key_result" do
      {_, key_result} = key_result_fixture(:with_objective, %{})
      assert {:ok, %KeyResult{}} = Okrs.delete_key_result(key_result)
      assert_raise Ecto.NoResultsError, fn -> Okrs.get_key_result!(key_result.id) end
    end

    test "change_key_result/1 returns a key_result changeset" do
      {_objective, key_result} = key_result_fixture(:with_objective, %{})
      assert %Ecto.Changeset{} = Okrs.change_key_result(key_result)
    end
  end
end
