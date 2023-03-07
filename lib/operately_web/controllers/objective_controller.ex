defmodule OperatelyWeb.ObjectiveController do
  use OperatelyWeb, :controller

  alias Operately.Okrs
  alias Operately.Okrs.Objective

  def index(conn, _params) do
    objectives = Okrs.list_objectives()
    render(conn, :index, objectives: objectives)
  end

  def new(conn, _params) do
    changeset = Okrs.change_objective(%Objective{})
    render(conn, :new, changeset: changeset)
  end

  def create(conn, %{"objective" => objective_params}) do
    case Okrs.create_objective(objective_params) do
      {:ok, objective} ->
        conn
        |> put_flash(:info, "Objective created successfully.")
        |> redirect(to: ~p"/objectives/#{objective}")

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :new, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    objective = Okrs.get_objective!(id)
    render(conn, :show, objective: objective)
  end

  def edit(conn, %{"id" => id}) do
    objective = Okrs.get_objective!(id)
    changeset = Okrs.change_objective(objective)
    render(conn, :edit, objective: objective, changeset: changeset)
  end

  def update(conn, %{"id" => id, "objective" => objective_params}) do
    objective = Okrs.get_objective!(id)

    case Okrs.update_objective(objective, objective_params) do
      {:ok, objective} ->
        conn
        |> put_flash(:info, "Objective updated successfully.")
        |> redirect(to: ~p"/objectives/#{objective}")

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :edit, objective: objective, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    objective = Okrs.get_objective!(id)
    {:ok, _objective} = Okrs.delete_objective(objective)

    conn
    |> put_flash(:info, "Objective deleted successfully.")
    |> redirect(to: ~p"/objectives")
  end
end
