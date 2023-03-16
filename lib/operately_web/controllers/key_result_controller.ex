defmodule OperatelyWeb.KeyResultController do
  use OperatelyWeb, :controller

  alias Operately.Okrs
  alias Operately.Okrs.KeyResult

  plug :find_objective when action in [:new, :create]
  plug :set_breradcrumb when action in [:new, :create]

  def new(conn, _params) do
    changeset = Okrs.change_key_result(%KeyResult{})

    render(conn, :new, changeset: changeset)
  end

  def create(conn, %{"key_result" => key_result_params}) do
    case Okrs.create_key_result(key_result_params) do
      {:ok, key_result} ->
        conn
        |> put_flash(:info, "Key result created successfully.")
        |> redirect(to: ~p"/objective/#{key_result.objective_id}")

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :new, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    key_result = Okrs.get_key_result!(id)
    render(conn, :show, key_result: key_result)
  end

  def edit(conn, %{"id" => id}) do
    key_result = Okrs.get_key_result!(id)
    changeset = Okrs.change_key_result(key_result)
    render(conn, :edit, key_result: key_result, changeset: changeset)
  end

  def update(conn, %{"id" => id, "key_result" => key_result_params}) do
    key_result = Okrs.get_key_result!(id)

    case Okrs.update_key_result(key_result, key_result_params) do
      {:ok, key_result} ->
        conn
        |> put_flash(:info, "Key result updated successfully.")
        |> redirect(to: ~p"/key_results/#{key_result}")

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :edit, key_result: key_result, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    key_result = Okrs.get_key_result!(id)
    {:ok, _key_result} = Okrs.delete_key_result(key_result)

    conn
    |> put_flash(:info, "Key result deleted successfully.")
    |> redirect(to: ~p"/key_results")
  end

  defp find_objective(conn, _params) do
    objective_id = conn.params["objective_id"]
    objective = Okrs.get_objective!(objective_id)

    conn
    |> assign(:objective, objective)
  end

  defp set_breradcrumb(conn, _params) do
    objective = conn.assigns.objective

    conn
    |> assign(:breadcrumbs, [
      %{name: "Objectives", path: ~p"/objectives"},
      %{name: objective.name, path: ~p"/objectives/#{objective.id}"}
    ])
  end
end
