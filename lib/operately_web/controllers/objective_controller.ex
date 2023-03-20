defmodule OperatelyWeb.ObjectiveController do
  use OperatelyWeb, :controller

  alias Operately.Okrs
  alias Operately.Okrs.Objective
  alias Operately.Alignments
  alias Operately.Alignments.Alignment
  alias Operately.Ownerships
  alias Operately.Ownerships.Ownership

  def index(conn, _params) do
    objectives = Okrs.list_objectives(preload: [:owner])
    IO.inspect(objectives)
    alignments = Alignments.list_alignments()

    render(conn, :index, objectives: objectives, alignments: alignments)
  end

  def new(conn, _params) do
    changeset = Okrs.change_objective(%Objective{})

    render_new_form(conn, changeset)
  end

  def create(conn, %{"objective" => params}) do
    creation_params =
      params
      |> translate_aligns_with()
      |> translate_ownership()

    case Okrs.create_objective(creation_params) do
      {:ok, objective} ->
        conn
        |> put_flash(:info, "Objective created successfully.")
        |> redirect(to: ~p"/objectives/#{objective}")

      {:error, %Ecto.Changeset{} = changeset} ->
        IO.inspect(changeset)

        render_new_form(conn, changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    objective = Okrs.get_objective!(id, preload: [:key_results])

    render(
      conn,
      :show,
      objective: objective,
      breadcrumbs: [%{name: "Objectives", path: "/objectives"}]
    )
  end

  def edit(conn, %{"id" => id}) do
    objective = Okrs.get_objective!(id, preload: [:parent])
    changeset = Okrs.change_objective(objective)
    render(conn, :edit, objective: objective, changeset: changeset)
  end

  def update(conn, %{"id" => id, "objective" => objective_params}) do
    objective = Okrs.get_objective!(id, preload: [:parent])

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

  defp render_new_form(conn, changeset) do
    render(conn, :new,
      changeset: changeset,
      parent_options: load_parent_options(),
      owner_options: load_owner_options()
    )
  end

  defp load_parent_options do
    objectives = Okrs.list_objectives()

    Enum.map(objectives, fn objective ->
      {"Objective: " <> objective.name, "objective_" <> objective.id}
    end)
  end

  defp load_owner_options do
    people = Operately.People.list_people()

    Enum.map(people, fn person ->
      {person.full_name, person.id}
    end)
  end

  defp translate_aligns_with(params) do
    case {Map.has_key?(params, "aligns_with"), params["aligns_with"]} do
      {true, "objective_" <> id} ->
        parent = %Alignment{
          parent_type: :objective,
          child_type: :objective,
          parent: id
        }

        Map.put(params, "aligns_with", parent)

      {true, ""} ->
        Map.delete(params, "aligns_with")

      {true, _} ->
        raise "Unknwon aligns_with type"

      {false, _} ->
        params
    end
  end

  defp translate_ownership(params) do
    case {Map.has_key?(params, "owned_by"), params["owned_by"]} do
      {true, person_id} ->
        ownership = %Ownership{
          target_type: :objective,
          person_id: person_id
        }

        Map.put(params, "owned_by", ownership)
      {false, _} ->
        params
    end
  end
end
