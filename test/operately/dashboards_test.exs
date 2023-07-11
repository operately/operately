defmodule Operately.DashboardsTest do
  use Operately.DataCase

  alias Operately.Dashboards

  describe "dashboards" do
    alias Operately.Dashboards.Dashboard

    import Operately.DashboardsFixtures

    @invalid_attrs %{}

    test "list_dashboards/0 returns all dashboards" do
      dashboard = dashboard_fixture()
      assert Dashboards.list_dashboards() == [dashboard]
    end

    test "get_dashboard!/1 returns the dashboard with given id" do
      dashboard = dashboard_fixture()
      assert Dashboards.get_dashboard!(dashboard.id) == dashboard
    end

    test "create_dashboard/1 with valid data creates a dashboard" do
      valid_attrs = %{}

      assert {:ok, %Dashboard{} = dashboard} = Dashboards.create_dashboard(valid_attrs)
    end

    test "create_dashboard/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Dashboards.create_dashboard(@invalid_attrs)
    end

    test "update_dashboard/2 with valid data updates the dashboard" do
      dashboard = dashboard_fixture()
      update_attrs = %{}

      assert {:ok, %Dashboard{} = dashboard} = Dashboards.update_dashboard(dashboard, update_attrs)
    end

    test "update_dashboard/2 with invalid data returns error changeset" do
      dashboard = dashboard_fixture()
      assert {:error, %Ecto.Changeset{}} = Dashboards.update_dashboard(dashboard, @invalid_attrs)
      assert dashboard == Dashboards.get_dashboard!(dashboard.id)
    end

    test "delete_dashboard/1 deletes the dashboard" do
      dashboard = dashboard_fixture()
      assert {:ok, %Dashboard{}} = Dashboards.delete_dashboard(dashboard)
      assert_raise Ecto.NoResultsError, fn -> Dashboards.get_dashboard!(dashboard.id) end
    end

    test "change_dashboard/1 returns a dashboard changeset" do
      dashboard = dashboard_fixture()
      assert %Ecto.Changeset{} = Dashboards.change_dashboard(dashboard)
    end
  end

  describe "dashboard_panels" do
    alias Operately.Dashboards.Panel

    import Operately.DashboardsFixtures

    @invalid_attrs %{index: nil, linked_resource_id: nil, linked_resource_type: nil}

    test "list_dashboard_panels/0 returns all dashboard_panels" do
      panel = panel_fixture()
      assert Dashboards.list_dashboard_panels() == [panel]
    end

    test "get_panel!/1 returns the panel with given id" do
      panel = panel_fixture()
      assert Dashboards.get_panel!(panel.id) == panel
    end

    test "create_panel/1 with valid data creates a panel" do
      valid_attrs = %{index: 42, linked_resource_id: "7488a646-e31f-11e4-aace-600308960662", linked_resource_type: "some linked_resource_type"}

      assert {:ok, %Panel{} = panel} = Dashboards.create_panel(valid_attrs)
      assert panel.index == 42
      assert panel.linked_resource_id == "7488a646-e31f-11e4-aace-600308960662"
      assert panel.linked_resource_type == "some linked_resource_type"
    end

    test "create_panel/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Dashboards.create_panel(@invalid_attrs)
    end

    test "update_panel/2 with valid data updates the panel" do
      panel = panel_fixture()
      update_attrs = %{index: 43, linked_resource_id: "7488a646-e31f-11e4-aace-600308960668", linked_resource_type: "some updated linked_resource_type"}

      assert {:ok, %Panel{} = panel} = Dashboards.update_panel(panel, update_attrs)
      assert panel.index == 43
      assert panel.linked_resource_id == "7488a646-e31f-11e4-aace-600308960668"
      assert panel.linked_resource_type == "some updated linked_resource_type"
    end

    test "update_panel/2 with invalid data returns error changeset" do
      panel = panel_fixture()
      assert {:error, %Ecto.Changeset{}} = Dashboards.update_panel(panel, @invalid_attrs)
      assert panel == Dashboards.get_panel!(panel.id)
    end

    test "delete_panel/1 deletes the panel" do
      panel = panel_fixture()
      assert {:ok, %Panel{}} = Dashboards.delete_panel(panel)
      assert_raise Ecto.NoResultsError, fn -> Dashboards.get_panel!(panel.id) end
    end

    test "change_panel/1 returns a panel changeset" do
      panel = panel_fixture()
      assert %Ecto.Changeset{} = Dashboards.change_panel(panel)
    end
  end
end
