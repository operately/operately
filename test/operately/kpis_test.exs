defmodule Operately.KpisTest do
  use Operately.DataCase

  alias Operately.Kpis

  describe "kpis" do
    alias Operately.Kpis.Kpi

    import Operately.KpisFixtures

    @invalid_attrs %{danger_direction: nil, danger_threshold: nil, name: nil, target: nil, target_direction: nil, unit: nil, warning_direction: nil, warning_threshold: nil}

    test "list_kpis/0 returns all kpis" do
      kpi = kpi_fixture()
      assert Kpis.list_kpis() == [kpi]
    end

    test "get_kpi!/1 returns the kpi with given id" do
      kpi = kpi_fixture()
      assert Kpis.get_kpi!(kpi.id) == kpi
    end

    test "create_kpi/1 with valid data creates a kpi" do
      valid_attrs = %{danger_direction: :above, danger_threshold: 42, name: "some name", target: 42, target_direction: :above, unit: :currency, warning_direction: :above, warning_threshold: 42}

      assert {:ok, %Kpi{} = kpi} = Kpis.create_kpi(valid_attrs)
      assert kpi.danger_direction == :above
      assert kpi.danger_threshold == 42
      assert kpi.name == "some name"
      assert kpi.target == 42
      assert kpi.target_direction == :above
      assert kpi.unit == :currency
      assert kpi.warning_direction == :above
      assert kpi.warning_threshold == 42
    end

    test "create_kpi/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Kpis.create_kpi(@invalid_attrs)
    end

    test "update_kpi/2 with valid data updates the kpi" do
      kpi = kpi_fixture()
      update_attrs = %{danger_direction: :below, danger_threshold: 43, name: "some updated name", target: 43, target_direction: :below, unit: :number, warning_direction: :below, warning_threshold: 43}

      assert {:ok, %Kpi{} = kpi} = Kpis.update_kpi(kpi, update_attrs)
      assert kpi.danger_direction == :below
      assert kpi.danger_threshold == 43
      assert kpi.name == "some updated name"
      assert kpi.target == 43
      assert kpi.target_direction == :below
      assert kpi.unit == :number
      assert kpi.warning_direction == :below
      assert kpi.warning_threshold == 43
    end

    test "update_kpi/2 with invalid data returns error changeset" do
      kpi = kpi_fixture()
      assert {:error, %Ecto.Changeset{}} = Kpis.update_kpi(kpi, @invalid_attrs)
      assert kpi == Kpis.get_kpi!(kpi.id)
    end

    test "delete_kpi/1 deletes the kpi" do
      kpi = kpi_fixture()
      assert {:ok, %Kpi{}} = Kpis.delete_kpi(kpi)
      assert_raise Ecto.NoResultsError, fn -> Kpis.get_kpi!(kpi.id) end
    end

    test "change_kpi/1 returns a kpi changeset" do
      kpi = kpi_fixture()
      assert %Ecto.Changeset{} = Kpis.change_kpi(kpi)
    end
  end

  describe "kpi_metrics" do
    alias Operately.Kpis.Metric

    import Operately.KpisFixtures

    @invalid_attrs %{date: nil, value: nil}

    test "list_kpi_metrics/0 returns all kpi_metrics" do
      metric = metric_fixture()
      assert Kpis.list_kpi_metrics() == [metric]
    end

    test "get_metric!/1 returns the metric with given id" do
      metric = metric_fixture()
      assert Kpis.get_metric!(metric.id) == metric
    end

    test "create_metric/1 with valid data creates a metric" do
      valid_attrs = %{date: ~N[2023-05-04 10:14:00], value: 42}

      assert {:ok, %Metric{} = metric} = Kpis.create_metric(valid_attrs)
      assert metric.date == ~N[2023-05-04 10:14:00]
      assert metric.value == 42
    end

    test "create_metric/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Kpis.create_metric(@invalid_attrs)
    end

    test "update_metric/2 with valid data updates the metric" do
      metric = metric_fixture()
      update_attrs = %{date: ~N[2023-05-05 10:14:00], value: 43}

      assert {:ok, %Metric{} = metric} = Kpis.update_metric(metric, update_attrs)
      assert metric.date == ~N[2023-05-05 10:14:00]
      assert metric.value == 43
    end

    test "update_metric/2 with invalid data returns error changeset" do
      metric = metric_fixture()
      assert {:error, %Ecto.Changeset{}} = Kpis.update_metric(metric, @invalid_attrs)
      assert metric == Kpis.get_metric!(metric.id)
    end

    test "delete_metric/1 deletes the metric" do
      metric = metric_fixture()
      assert {:ok, %Metric{}} = Kpis.delete_metric(metric)
      assert_raise Ecto.NoResultsError, fn -> Kpis.get_metric!(metric.id) end
    end

    test "change_metric/1 returns a metric changeset" do
      metric = metric_fixture()
      assert %Ecto.Changeset{} = Kpis.change_metric(metric)
    end
  end
end
