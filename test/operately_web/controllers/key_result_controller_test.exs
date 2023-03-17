defmodule OperatelyWeb.KeyResultControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.OkrsFixtures

  @create_attrs %{direction: :above, name: "some name", target: 42, unit: :percentage}
  @update_attrs %{direction: :below, name: "some updated name", target: 43, unit: :number}
  @invalid_attrs %{direction: nil, name: nil, target: nil, unit: nil}

  setup :register_and_log_in_account

  setup do
    objective = objective_fixture()

    {:ok, objective: objective}
  end

  describe "new key_result" do
    test "renders form", %{conn: conn, objective: objective} do
      conn = get(conn, ~p"/objectives/#{objective}/key_results/new")
      assert html_response(conn, 200) =~ "Add a Key Result"
    end
  end

  describe "create key_result" do
    test "redirects to show when data is valid", %{conn: conn, objective: objective} do
      attrs = Map.merge(@create_attrs, %{objective_id: objective.id})
      conn = post(conn, ~p"/objectives/#{objective}/key_results", key_result: attrs)

      assert %{id: id} = redirected_params(conn)
      assert redirected_to(conn) == ~p"/objectives/#{id}"
    end

    test "renders errors when data is invalid", %{conn: conn, objective: objective} do
      conn = post(conn, ~p"/objectives/#{objective}/key_results", key_result: @invalid_attrs)
      assert html_response(conn, 200) =~ "Add a Key Result"
    end
  end

  describe "edit key_result" do
    setup [:create_key_result]

    test "renders form for editing chosen key_result", %{conn: conn, key_result: key_result, objective: objective} do
      conn = get(conn, ~p"/objectives/#{objective}/key_results/#{key_result}/edit")
      assert html_response(conn, 200) =~ "Edit Key result"
    end
  end

  describe "update key_result" do
    setup [:create_key_result]

    test "redirects when data is valid", %{conn: conn, key_result: key_result, objective: objective} do
      conn = put(conn, ~p"/objectives/#{objective}/key_results/#{key_result}", key_result: @update_attrs)
      assert redirected_to(conn) == ~p"/objectives/#{objective}"

      conn = get(conn, ~p"/objectives/#{objective}/key_results/#{key_result}")
      assert html_response(conn, 200) =~ "some updated name"
    end

    test "renders errors when data is invalid", %{conn: conn, key_result: key_result, objective: objective} do
      conn = put(conn, ~p"/objectives/#{objective}/key_results/#{key_result}", key_result: @invalid_attrs)
      assert html_response(conn, 200) =~ "Edit Key result"
    end
  end

  describe "delete key_result" do
    setup [:create_key_result]

    test "deletes chosen key_result", %{conn: conn, key_result: key_result, objective: objective} do
      conn = delete(conn, ~p"/objectives/#{objective}/key_results/#{key_result}")
      assert redirected_to(conn) == ~p"/objectives/#{objective}"

      assert_error_sent 404, fn ->
        get(conn, ~p"/objectives/{objective}/key_results/#{key_result}")
      end
    end
  end

  defp create_key_result(attr) do
    key_result = key_result_fixture(%{objective_id: attr.objective.id})

    %{key_result: key_result}
  end
end
