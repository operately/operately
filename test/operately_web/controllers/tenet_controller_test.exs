defmodule OperatelyWeb.TenetControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.TenetsFixtures

  @create_attrs %{description: "some description", name: "some name"}
  @update_attrs %{description: "some updated description", name: "some updated name"}
  @invalid_attrs %{description: nil, name: nil}

  describe "index" do
    test "lists all tenets", %{conn: conn} do
      conn = get(conn, ~p"/tenets")
      assert html_response(conn, 200) =~ "Listing Tenets"
    end
  end

  describe "new tenet" do
    test "renders form", %{conn: conn} do
      conn = get(conn, ~p"/tenets/new")
      assert html_response(conn, 200) =~ "New Tenet"
    end
  end

  describe "create tenet" do
    test "redirects to show when data is valid", %{conn: conn} do
      conn = post(conn, ~p"/tenets", tenet: @create_attrs)

      assert %{id: id} = redirected_params(conn)
      assert redirected_to(conn) == ~p"/tenets/#{id}"

      conn = get(conn, ~p"/tenets/#{id}")
      assert html_response(conn, 200) =~ "Tenet #{id}"
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/tenets", tenet: @invalid_attrs)
      assert html_response(conn, 200) =~ "New Tenet"
    end
  end

  describe "edit tenet" do
    setup [:create_tenet]

    test "renders form for editing chosen tenet", %{conn: conn, tenet: tenet} do
      conn = get(conn, ~p"/tenets/#{tenet}/edit")
      assert html_response(conn, 200) =~ "Edit Tenet"
    end
  end

  describe "update tenet" do
    setup [:create_tenet]

    test "redirects when data is valid", %{conn: conn, tenet: tenet} do
      conn = put(conn, ~p"/tenets/#{tenet}", tenet: @update_attrs)
      assert redirected_to(conn) == ~p"/tenets/#{tenet}"

      conn = get(conn, ~p"/tenets/#{tenet}")
      assert html_response(conn, 200) =~ "some updated description"
    end

    test "renders errors when data is invalid", %{conn: conn, tenet: tenet} do
      conn = put(conn, ~p"/tenets/#{tenet}", tenet: @invalid_attrs)
      assert html_response(conn, 200) =~ "Edit Tenet"
    end
  end

  describe "delete tenet" do
    setup [:create_tenet]

    test "deletes chosen tenet", %{conn: conn, tenet: tenet} do
      conn = delete(conn, ~p"/tenets/#{tenet}")
      assert redirected_to(conn) == ~p"/tenets"

      assert_error_sent 404, fn ->
        get(conn, ~p"/tenets/#{tenet}")
      end
    end
  end

  defp create_tenet(_) do
    tenet = tenet_fixture()
    %{tenet: tenet}
  end
end
