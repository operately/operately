defmodule OperatelyWeb.KeyResultControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.OkrsFixtures

  @create_attrs %{direction: :above, name: "some name", target: 42, unit: :percentage}
  @update_attrs %{direction: :below, name: "some updated name", target: 43, unit: :number}
  @invalid_attrs %{direction: nil, name: nil, target: nil, unit: nil}

  describe "index" do
    test "lists all key_results", %{conn: conn} do
      conn = get(conn, ~p"/key_results")
      assert html_response(conn, 200) =~ "Listing Key results"
    end
  end

  describe "new key_result" do
    test "renders form", %{conn: conn} do
      conn = get(conn, ~p"/key_results/new")
      assert html_response(conn, 200) =~ "New Key result"
    end
  end

  describe "create key_result" do
    test "redirects to show when data is valid", %{conn: conn} do
      conn = post(conn, ~p"/key_results", key_result: @create_attrs)

      assert %{id: id} = redirected_params(conn)
      assert redirected_to(conn) == ~p"/key_results/#{id}"

      conn = get(conn, ~p"/key_results/#{id}")
      assert html_response(conn, 200) =~ "Key result #{id}"
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/key_results", key_result: @invalid_attrs)
      assert html_response(conn, 200) =~ "New Key result"
    end
  end

  describe "edit key_result" do
    setup [:create_key_result]

    test "renders form for editing chosen key_result", %{conn: conn, key_result: key_result} do
      conn = get(conn, ~p"/key_results/#{key_result}/edit")
      assert html_response(conn, 200) =~ "Edit Key result"
    end
  end

  describe "update key_result" do
    setup [:create_key_result]

    test "redirects when data is valid", %{conn: conn, key_result: key_result} do
      conn = put(conn, ~p"/key_results/#{key_result}", key_result: @update_attrs)
      assert redirected_to(conn) == ~p"/key_results/#{key_result}"

      conn = get(conn, ~p"/key_results/#{key_result}")
      assert html_response(conn, 200) =~ "some updated name"
    end

    test "renders errors when data is invalid", %{conn: conn, key_result: key_result} do
      conn = put(conn, ~p"/key_results/#{key_result}", key_result: @invalid_attrs)
      assert html_response(conn, 200) =~ "Edit Key result"
    end
  end

  describe "delete key_result" do
    setup [:create_key_result]

    test "deletes chosen key_result", %{conn: conn, key_result: key_result} do
      conn = delete(conn, ~p"/key_results/#{key_result}")
      assert redirected_to(conn) == ~p"/key_results"

      assert_error_sent 404, fn ->
        get(conn, ~p"/key_results/#{key_result}")
      end
    end
  end

  defp create_key_result(_) do
    key_result = key_result_fixture()
    %{key_result: key_result}
  end
end
