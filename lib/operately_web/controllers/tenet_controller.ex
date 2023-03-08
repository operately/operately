defmodule OperatelyWeb.TenetController do
  use OperatelyWeb, :controller

  alias Operately.Tenets
  alias Operately.Tenets.Tenet

  def index(conn, _params) do
    tenets = Tenets.list_tenets()
    render(conn, :index, tenets: tenets)
  end

  def new(conn, _params) do
    changeset = Tenets.change_tenet(%Tenet{})
    render(conn, :new, changeset: changeset)
  end

  def create(conn, %{"tenet" => tenet_params}) do
    case Tenets.create_tenet(tenet_params) do
      {:ok, tenet} ->
        conn
        |> put_flash(:info, "Tenet created successfully.")
        |> redirect(to: ~p"/tenets/#{tenet}")

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :new, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    tenet = Tenets.get_tenet!(id)
    render(conn, :show, tenet: tenet)
  end

  def edit(conn, %{"id" => id}) do
    tenet = Tenets.get_tenet!(id)
    changeset = Tenets.change_tenet(tenet)
    render(conn, :edit, tenet: tenet, changeset: changeset)
  end

  def update(conn, %{"id" => id, "tenet" => tenet_params}) do
    tenet = Tenets.get_tenet!(id)

    case Tenets.update_tenet(tenet, tenet_params) do
      {:ok, tenet} ->
        conn
        |> put_flash(:info, "Tenet updated successfully.")
        |> redirect(to: ~p"/tenets/#{tenet}")

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :edit, tenet: tenet, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    tenet = Tenets.get_tenet!(id)
    {:ok, _tenet} = Tenets.delete_tenet(tenet)

    conn
    |> put_flash(:info, "Tenet deleted successfully.")
    |> redirect(to: ~p"/tenets")
  end
end
