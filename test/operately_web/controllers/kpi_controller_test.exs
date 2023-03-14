defmodule OperatelyWeb.KpiControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.KpisFixtures

  setup :register_and_log_in_account

  @create_attrs %{danger_direction: :above, danger_threshold: 42, name: "some name", target: 42, target_direction: :above, unit: :currency, warning_direction: :above, warning_threshold: 42}
  @update_attrs %{danger_direction: :below, danger_threshold: 43, name: "some updated name", target: 43, target_direction: :below, unit: :number, warning_direction: :below, warning_threshold: 43}
  @invalid_attrs %{danger_direction: nil, danger_threshold: nil, name: nil, target: nil, target_direction: nil, unit: nil, warning_direction: nil, warning_threshold: nil}

  describe "index" do
    test "lists all kpis", %{conn: conn} do
      conn = get(conn, ~p"/kpis")
      assert html_response(conn, 200) =~ "Listing Kpis"
    end
  end

  describe "new kpi" do
    test "renders form", %{conn: conn} do
      conn = get(conn, ~p"/kpis/new")
      assert html_response(conn, 200) =~ "New Kpi"
    end
  end

  describe "create kpi" do
    test "redirects to show when data is valid", %{conn: conn} do
      conn = post(conn, ~p"/kpis", kpi: @create_attrs)

      assert %{id: id} = redirected_params(conn)
      assert redirected_to(conn) == ~p"/kpis/#{id}"

      conn = get(conn, ~p"/kpis/#{id}")
      assert html_response(conn, 200) =~ "Kpi #{id}"
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/kpis", kpi: @invalid_attrs)
      assert html_response(conn, 200) =~ "New Kpi"
    end
  end

  describe "edit kpi" do
    setup [:create_kpi]

    test "renders form for editing chosen kpi", %{conn: conn, kpi: kpi} do
      conn = get(conn, ~p"/kpis/#{kpi}/edit")
      assert html_response(conn, 200) =~ "Edit Kpi"
    end
  end

  describe "update kpi" do
    setup [:create_kpi]

    test "redirects when data is valid", %{conn: conn, kpi: kpi} do
      conn = put(conn, ~p"/kpis/#{kpi}", kpi: @update_attrs)
      assert redirected_to(conn) == ~p"/kpis/#{kpi}"

      conn = get(conn, ~p"/kpis/#{kpi}")
      assert html_response(conn, 200) =~ "some updated name"
    end

    test "renders errors when data is invalid", %{conn: conn, kpi: kpi} do
      conn = put(conn, ~p"/kpis/#{kpi}", kpi: @invalid_attrs)
      assert html_response(conn, 200) =~ "Edit Kpi"
    end
  end

  describe "delete kpi" do
    setup [:create_kpi]

    test "deletes chosen kpi", %{conn: conn, kpi: kpi} do
      conn = delete(conn, ~p"/kpis/#{kpi}")
      assert redirected_to(conn) == ~p"/kpis"

      assert_error_sent 404, fn ->
        get(conn, ~p"/kpis/#{kpi}")
      end
    end
  end

  defp create_kpi(_) do
    kpi = kpi_fixture()
    %{kpi: kpi}
  end
end
