defmodule OperatelyWeb.ProjectControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.ProjectsFixtures

  setup :register_and_log_in_account

  @create_attrs %{description: "some description", name: "some name"}
  @update_attrs %{description: "some updated description", name: "some updated name"}
  @invalid_attrs %{description: nil, name: nil}

  describe "index" do
    test "lists all projects", %{conn: conn} do
      conn = get(conn, ~p"/projects")
      assert html_response(conn, 200) =~ "Listing Projects"
    end
  end

  describe "new project" do
    test "renders form", %{conn: conn} do
      conn = get(conn, ~p"/projects/new")
      assert html_response(conn, 200) =~ "New Project"
    end
  end

  describe "create project" do
    test "redirects to show when data is valid", %{conn: conn} do
      conn = post(conn, ~p"/projects", project: @create_attrs)

      assert %{id: id} = redirected_params(conn)
      assert redirected_to(conn) == ~p"/projects/#{id}"

      conn = get(conn, ~p"/projects/#{id}")
      assert html_response(conn, 200) =~ "Project #{id}"
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/projects", project: @invalid_attrs)
      assert html_response(conn, 200) =~ "New Project"
    end
  end

  describe "edit project" do
    setup [:create_project]

    test "renders form for editing chosen project", %{conn: conn, project: project} do
      conn = get(conn, ~p"/projects/#{project}/edit")
      assert html_response(conn, 200) =~ "Edit Project"
    end
  end

  describe "update project" do
    setup [:create_project]

    test "redirects when data is valid", %{conn: conn, project: project} do
      conn = put(conn, ~p"/projects/#{project}", project: @update_attrs)
      assert redirected_to(conn) == ~p"/projects/#{project}"

      conn = get(conn, ~p"/projects/#{project}")
      assert html_response(conn, 200) =~ "some updated description"
    end

    test "renders errors when data is invalid", %{conn: conn, project: project} do
      conn = put(conn, ~p"/projects/#{project}", project: @invalid_attrs)
      assert html_response(conn, 200) =~ "Edit Project"
    end
  end

  describe "delete project" do
    setup [:create_project]

    test "deletes chosen project", %{conn: conn, project: project} do
      conn = delete(conn, ~p"/projects/#{project}")
      assert redirected_to(conn) == ~p"/projects"

      assert_error_sent 404, fn ->
        get(conn, ~p"/projects/#{project}")
      end
    end
  end

  defp create_project(_) do
    project = project_fixture()
    %{project: project}
  end
end
