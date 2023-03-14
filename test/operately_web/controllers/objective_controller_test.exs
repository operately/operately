defmodule OperatelyWeb.ObjectiveControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.OkrsFixtures

  @create_attrs %{description: "some description", name: "some name"}
  @update_attrs %{description: "some updated description", name: "some updated name"}
  @key_results_attrs %{
    "1" => %{
        name: "some name",
        target: "42",
        unit: "number",
        direction: "above",
        warning_threshold: "42",
        warning_direction: "above",
        danger_treshold: "42",
        danger_direction: "above"
    },
    "2" => %{
        name: "some name",
        target: "42",
        unit: "number",
        direction: "above",
        warning_threshold: "42",
        warning_direction: "above",
        danger_treshold: "42",
        danger_direction: "above"
    }
  }

  @invalid_attrs %{description: nil, name: nil}

  describe "index" do
    test "lists all objectives", %{conn: conn} do
      conn = get(conn, ~p"/objectives")
      assert html_response(conn, 200) =~ "Listing Objectives"
    end
  end

  describe "new objective" do
    test "renders form", %{conn: conn} do
      conn = get(conn, ~p"/objectives/new")
      assert html_response(conn, 200) =~ "New Objective"
    end
  end

  describe "create objective" do
    test "redirects to show when data is valid", %{conn: conn} do
      conn = post(conn, ~p"/objectives", objective: @create_attrs, key_results: @key_results_attrs)

      assert %{id: id} = redirected_params(conn)
      assert redirected_to(conn) == ~p"/objectives/#{id}"

      conn = get(conn, ~p"/objectives/#{id}")
      assert html_response(conn, 200) =~ "Objective #{@create_attrs.name}"
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/objectives", objective: @invalid_attrs, key_results: %{})
      assert html_response(conn, 200) =~ "New Objective"
    end
  end

  describe "edit objective" do
    setup [:create_objective]

    test "renders form for editing chosen objective", %{conn: conn, objective: objective} do
      conn = get(conn, ~p"/objectives/#{objective}/edit")
      assert html_response(conn, 200) =~ "Edit Objective"
    end
  end

  describe "update objective" do
    setup [:create_objective]

    test "redirects when data is valid", %{conn: conn, objective: objective} do
      conn = put(conn, ~p"/objectives/#{objective}", objective: @update_attrs)
      assert redirected_to(conn) == ~p"/objectives/#{objective}"

      conn = get(conn, ~p"/objectives/#{objective}")
      assert html_response(conn, 200) =~ "some updated description"
    end

    test "renders errors when data is invalid", %{conn: conn, objective: objective} do
      conn = put(conn, ~p"/objectives/#{objective}", objective: @invalid_attrs)
      assert html_response(conn, 200) =~ "Edit Objective"
    end
  end

  describe "delete objective" do
    setup [:create_objective]

    test "deletes chosen objective", %{conn: conn, objective: objective} do
      conn = delete(conn, ~p"/objectives/#{objective}")
      assert redirected_to(conn) == ~p"/objectives"

      assert_error_sent 404, fn ->
        get(conn, ~p"/objectives/#{objective}")
      end
    end
  end

  defp create_objective(_) do
    objective = objective_fixture()
    %{objective: objective}
  end
end
