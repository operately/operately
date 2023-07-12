defmodule Operately.DashboardsTest do
  use Operately.DataCase

  alias Operately.Dashboards

  describe "dashboards" do
    alias Operately.Dashboards.Dashboard

    import Operately.CompaniesFixtures
    import Operately.DashboardsFixtures

    @invalid_attrs %{}

    setup do
      company = company_fixture()

      {:ok, company: company}
    end

    test "list_dashboards/0 returns all dashboards", ctx do
      dashboard = dashboard_fixture(%{company_id: ctx.company.id})
      assert Dashboards.list_dashboards() == [dashboard]
    end

    test "get_dashboard!/1 returns the dashboard with given id", ctx do
      dashboard = dashboard_fixture(%{company_id: ctx.company.id})
      assert Dashboards.get_dashboard!(dashboard.id) == dashboard
    end

    test "create_dashboard/1 with valid data creates a dashboard", ctx do
      valid_attrs = %{company_id: ctx.company.id}

      assert {:ok, %Dashboard{}} = Dashboards.create_dashboard(valid_attrs)
    end

    test "create_dashboard/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Dashboards.create_dashboard(%{company_id: nil})
    end

    test "update_dashboard/2 with valid data updates the dashboard", ctx do
      dashboard = dashboard_fixture(%{company_id: ctx.company.id})
      update_attrs = %{}

      assert {:ok, %Dashboard{}} = Dashboards.update_dashboard(dashboard, update_attrs)
    end

    test "delete_dashboard/1 deletes the dashboard", ctx do
      dashboard = dashboard_fixture(%{company_id: ctx.company.id})
      assert {:ok, %Dashboard{}} = Dashboards.delete_dashboard(dashboard)
      assert_raise Ecto.NoResultsError, fn -> Dashboards.get_dashboard!(dashboard.id) end
    end

    test "change_dashboard/1 returns a dashboard changeset", ctx do
      dashboard = dashboard_fixture(%{company_id: ctx.company.id})
      assert %Ecto.Changeset{} = Dashboards.change_dashboard(dashboard)
    end
  end

  describe "dashboard_panels" do
    alias Operately.Dashboards.Panel

    import Operately.CompaniesFixtures
    import Operately.DashboardsFixtures

    @invalid_attrs %{index: nil, linked_resource_id: nil, linked_resource_type: nil}

    setup do
      company = company_fixture()
      dashboard = dashboard_fixture(%{company_id: company.id})

      {:ok, dashboard: dashboard}
    end

    test "list_dashboard_panels/0 returns all dashboard_panels", ctx do
      panel = panel_fixture(%{dashboard_id: ctx.dashboard.id})
      assert Dashboards.list_dashboard_panels() == [panel]
    end

    test "get_panel!/1 returns the panel with given id", ctx do
      panel = panel_fixture(%{dashboard_id: ctx.dashboard.id})
      assert Dashboards.get_panel!(panel.id) == panel
    end

    test "create_panel/1 with valid data creates a panel", ctx do
      valid_attrs = %{
        dashboard_id: ctx.dashboard.id,
        type: "activity",
        index: 42, 
        linked_resource_id: "7488a646-e31f-11e4-aace-600308960662",
        linked_resource_type: "some linked_resource_type"
      }

      assert {:ok, %Panel{} = panel} = Dashboards.create_panel(valid_attrs)
      assert panel.index == 42
      assert panel.linked_resource_id == "7488a646-e31f-11e4-aace-600308960662"
      assert panel.linked_resource_type == "some linked_resource_type"
    end

    test "create_panel/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Dashboards.create_panel(@invalid_attrs)
    end

    test "update_panel/2 with valid data updates the panel", ctx do
      panel = panel_fixture(%{dashboard_id: ctx.dashboard.id})
      update_attrs = %{
        type: "activity",
        index: 43,
      }

      assert {:ok, %Panel{} = panel} = Dashboards.update_panel(panel, update_attrs)
      assert panel.index == 43
      assert panel.type == "activity"
    end

    test "update_panel/2 with invalid data returns error changeset", ctx do
      panel = panel_fixture(%{dashboard_id: ctx.dashboard.id})
      assert {:error, %Ecto.Changeset{}} = Dashboards.update_panel(panel, %{type: nil})
      assert panel == Dashboards.get_panel!(panel.id)
    end

    test "delete_panel/1 deletes the panel", ctx do
      panel = panel_fixture(%{dashboard_id: ctx.dashboard.id})
      assert {:ok, %Panel{}} = Dashboards.delete_panel(panel)
      assert_raise Ecto.NoResultsError, fn -> Dashboards.get_panel!(panel.id) end
    end

    test "change_panel/1 returns a panel changeset", ctx do
      panel = panel_fixture(%{dashboard_id: ctx.dashboard.id})
      assert %Ecto.Changeset{} = Dashboards.change_panel(panel)
    end
  end
end
