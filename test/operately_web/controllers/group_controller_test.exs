defmodule OperatelyWeb.GroupControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.GroupsFixtures

  @create_attrs %{name: "some name"}
  @update_attrs %{name: "some updated name"}
  @invalid_attrs %{name: nil}

  describe "index" do
    test "lists all groups", %{conn: conn} do
      conn = get(conn, ~p"/groups")
      assert html_response(conn, 200) =~ "Listing Groups"
    end
  end

  describe "new group" do
    test "renders form", %{conn: conn} do
      conn = get(conn, ~p"/groups/new")
      assert html_response(conn, 200) =~ "New Group"
    end
  end

  describe "create group" do
    test "redirects to show when data is valid", %{conn: conn} do
      conn = post(conn, ~p"/groups", group: @create_attrs)

      assert %{id: id} = redirected_params(conn)
      assert redirected_to(conn) == ~p"/groups/#{id}"

      conn = get(conn, ~p"/groups/#{id}")
      assert html_response(conn, 200) =~ "Group #{id}"
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/groups", group: @invalid_attrs)
      assert html_response(conn, 200) =~ "New Group"
    end
  end

  describe "edit group" do
    setup [:create_group]

    test "renders form for editing chosen group", %{conn: conn, group: group} do
      conn = get(conn, ~p"/groups/#{group}/edit")
      assert html_response(conn, 200) =~ "Edit Group"
    end
  end

  describe "update group" do
    setup [:create_group]

    test "redirects when data is valid", %{conn: conn, group: group} do
      conn = put(conn, ~p"/groups/#{group}", group: @update_attrs)
      assert redirected_to(conn) == ~p"/groups/#{group}"

      conn = get(conn, ~p"/groups/#{group}")
      assert html_response(conn, 200) =~ "some updated name"
    end

    test "renders errors when data is invalid", %{conn: conn, group: group} do
      conn = put(conn, ~p"/groups/#{group}", group: @invalid_attrs)
      assert html_response(conn, 200) =~ "Edit Group"
    end
  end

  describe "delete group" do
    setup [:create_group]

    test "deletes chosen group", %{conn: conn, group: group} do
      conn = delete(conn, ~p"/groups/#{group}")
      assert redirected_to(conn) == ~p"/groups"

      assert_error_sent 404, fn ->
        get(conn, ~p"/groups/#{group}")
      end
    end
  end

  defp create_group(_) do
    group = group_fixture()
    %{group: group}
  end
end
