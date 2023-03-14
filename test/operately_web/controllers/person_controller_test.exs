defmodule OperatelyWeb.PersonControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.PeopleFixtures

  @create_attrs %{full_name: "some full_name", handle: "some handle", title: "some title"}
  @update_attrs %{full_name: "some updated full_name", handle: "some updated handle", title: "some updated title"}
  @invalid_attrs %{full_name: nil, handle: nil, title: nil}

  describe "index" do
    test "lists all people", %{conn: conn} do
      conn = get(conn, ~p"/people")
      assert html_response(conn, 200) =~ "Listing People"
    end
  end

  describe "new person" do
    test "renders form", %{conn: conn} do
      conn = get(conn, ~p"/people/new")
      assert html_response(conn, 200) =~ "New Person"
    end
  end

  describe "create person" do
    test "redirects to show when data is valid", %{conn: conn} do
      conn = post(conn, ~p"/people", person: @create_attrs)

      assert %{id: id} = redirected_params(conn)
      assert redirected_to(conn) == ~p"/people/#{id}"

      conn = get(conn, ~p"/people/#{id}")
      assert html_response(conn, 200) =~ "Person #{id}"
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/people", person: @invalid_attrs)
      assert html_response(conn, 200) =~ "New Person"
    end
  end

  describe "edit person" do
    setup [:create_person]

    test "renders form for editing chosen person", %{conn: conn, person: person} do
      conn = get(conn, ~p"/people/#{person}/edit")
      assert html_response(conn, 200) =~ "Edit Person"
    end
  end

  describe "update person" do
    setup [:create_person]

    test "redirects when data is valid", %{conn: conn, person: person} do
      conn = put(conn, ~p"/people/#{person}", person: @update_attrs)
      assert redirected_to(conn) == ~p"/people/#{person}"

      conn = get(conn, ~p"/people/#{person}")
      assert html_response(conn, 200) =~ "some updated full_name"
    end

    test "renders errors when data is invalid", %{conn: conn, person: person} do
      conn = put(conn, ~p"/people/#{person}", person: @invalid_attrs)
      assert html_response(conn, 200) =~ "Edit Person"
    end
  end

  describe "delete person" do
    setup [:create_person]

    test "deletes chosen person", %{conn: conn, person: person} do
      conn = delete(conn, ~p"/people/#{person}")
      assert redirected_to(conn) == ~p"/people"

      assert_error_sent 404, fn ->
        get(conn, ~p"/people/#{person}")
      end
    end
  end

  defp create_person(_) do
    person = person_fixture()
    %{person: person}
  end
end
