defmodule OperatelyWeb.GroupController do
  use OperatelyWeb, :controller

  alias Operately.Groups
  alias Operately.Groups.Group

  def index(conn, _params) do
    props = %{
      groups: Groups.list_groups()
    }

    render(conn, :index, props: Jason.encode!(props))
  end

  def new(conn, _params) do
    changeset = Groups.change_group(%Group{})
    render(conn, :new, changeset: changeset)
  end

  def create(conn, %{"group" => group_params}) do
    case Groups.create_group(group_params) do
      {:ok, group} ->
        conn
        |> put_flash(:info, "Group created successfully.")
        |> redirect(to: ~p"/groups/#{group}")

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :new, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    props = %{
      group: Groups.get_group!(id)
    }

    render(conn, :show,
      props: Jason.encode!(props),
      breadcrumbs: [%{name: "Groups", path: "/groups"}]
    )
  end

  def edit(conn, %{"id" => id}) do
    group = Groups.get_group!(id)
    changeset = Groups.change_group(group)
    render(conn, :edit, group: group, changeset: changeset)
  end

  def update(conn, %{"id" => id, "group" => group_params}) do
    group = Groups.get_group!(id)

    case Groups.update_group(group, group_params) do
      {:ok, group} ->
        conn
        |> put_flash(:info, "Group updated successfully.")
        |> redirect(to: ~p"/groups/#{group}")

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :edit, group: group, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    group = Groups.get_group!(id)
    {:ok, _group} = Groups.delete_group(group)

    conn
    |> put_flash(:info, "Group deleted successfully.")
    |> redirect(to: ~p"/groups")
  end

  def people_search(conn, %{"contains" => str}) do
    people =
      Operately.People.list_people()
      |> Enum.filter(fn p -> String.contains?(String.downcase(p.full_name), String.downcase(str)) end)
      |> Enum.map(fn p -> %{"full_name" => p.full_name, "id" => p.id} end)

    json(conn, people)
  end

  def add_people(conn, params) do
    people_ids = get_in(params, ["data", "people"])

    IO.inspect(people_ids)
  end
end
