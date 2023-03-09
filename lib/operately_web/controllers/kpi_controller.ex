defmodule OperatelyWeb.KpiController do
  use OperatelyWeb, :controller

  alias Operately.Kpis
  alias Operately.Kpis.Kpi

  def index(conn, _params) do
    kpis = Kpis.list_kpis()
    render(conn, :index, kpis: kpis)
  end

  def new(conn, _params) do
    changeset = Kpis.change_kpi(%Kpi{})
    render(conn, :new, changeset: changeset)
  end

  def create(conn, %{"kpi" => kpi_params}) do
    case Kpis.create_kpi(kpi_params) do
      {:ok, kpi} ->
        conn
        |> put_flash(:info, "Kpi created successfully.")
        |> redirect(to: ~p"/kpis/#{kpi}")

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :new, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    kpi = Kpis.get_kpi!(id)
    render(conn, :show, kpi: kpi)
  end

  def edit(conn, %{"id" => id}) do
    kpi = Kpis.get_kpi!(id)
    changeset = Kpis.change_kpi(kpi)
    render(conn, :edit, kpi: kpi, changeset: changeset)
  end

  def update(conn, %{"id" => id, "kpi" => kpi_params}) do
    kpi = Kpis.get_kpi!(id)

    case Kpis.update_kpi(kpi, kpi_params) do
      {:ok, kpi} ->
        conn
        |> put_flash(:info, "Kpi updated successfully.")
        |> redirect(to: ~p"/kpis/#{kpi}")

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :edit, kpi: kpi, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    kpi = Kpis.get_kpi!(id)
    {:ok, _kpi} = Kpis.delete_kpi(kpi)

    conn
    |> put_flash(:info, "Kpi deleted successfully.")
    |> redirect(to: ~p"/kpis")
  end
end
