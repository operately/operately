defmodule OperatelyWeb.MarkdownExportController do
  use OperatelyWeb, :controller

  alias Operately.Companies
  alias Operately.MD.{Goal, Project}
  alias Operately.People
  alias Operately.Goals.Goal, as: GoalSchema
  alias Operately.Projects.Project, as: ProjectSchema

  import OperatelyWeb.Api.Helpers, only: [decode_id: 1, find_me: 1, id_without_comments: 1]

  def project(conn, %{"id" => id}) do
    conn = ensure_company_and_person(conn)

    with {:ok, person} <- find_me(conn),
         {:ok, project_id} <- decode_id(id_without_comments(id)),
         {:ok, project} <- ProjectSchema.get(person, id: project_id, opts: [with_deleted: true]) do
      markdown = Project.render(project)
      filename = sanitize_filename(project.name || "project")

      send_markdown(conn, markdown, filename)
    else
      {:error, :not_found} ->
        not_found(conn)

      {:error, :unauthorized} ->
        unauthorized(conn)

      {:error, status, _} when is_integer(status) ->
        send_resp(conn, status, "")

      {:error, status, _} when is_atom(status) ->
        send_resp(conn, Plug.Conn.Status.code(status), "")

      _ ->
        not_found(conn)
    end
  end

  def goal(conn, %{"id" => id}) do
    conn = ensure_company_and_person(conn)

    with {:ok, person} <- find_me(conn),
         {:ok, goal_id} <- decode_id(id_without_comments(id)),
         {:ok, goal} <- GoalSchema.get(person, id: goal_id, opts: [with_deleted: true]) do
      markdown = Goal.render(goal)
      filename = sanitize_filename(goal.name || "goal")

      send_markdown(conn, markdown, filename)
    else
      {:error, :not_found} ->
        not_found(conn)

      {:error, :unauthorized} ->
        unauthorized(conn)

      {:error, status, _} when is_integer(status) ->
        send_resp(conn, status, "")

      {:error, status, _} when is_atom(status) ->
        send_resp(conn, Plug.Conn.Status.code(status), "")

      _ ->
        not_found(conn)
    end
  end

  defp send_markdown(conn, markdown, filename) do
    send_download(conn, {:binary, markdown},
      filename: filename <> ".md",
      content_type: "text/markdown"
    )
  end

  defp sanitize_filename(name) when is_binary(name) do
    name
    |> String.trim()
    |> String.replace(~r/\s+/, " ")
    |> String.graphemes()
    |> Enum.reject(&(&1 in ["\\", "/", ":", "*", "?", "\"", "<", ">", "|"]))
    |> Enum.join()
    |> case do
      "" -> "export"
      other -> other
    end
  end

  defp sanitize_filename(_), do: "export"

  defp not_found(conn) do
    send_resp(conn, :not_found, "")
  end

  defp unauthorized(conn) do
    send_resp(conn, :forbidden, "")
  end

  defp ensure_company_and_person(conn) do
    conn
    |> ensure_current_company()
    |> ensure_current_person()
  end

  defp ensure_current_company(conn) do
    case conn.assigns[:current_company] do
      %Companies.Company{} ->
        conn

      _ ->
        with company_slug when is_binary(company_slug) <- conn.path_params["company_id"],
             decoded <- id_without_comments(company_slug),
             {:ok, id} <- Companies.ShortId.decode(decoded),
             company <- Companies.get_company!(id) do
          Plug.Conn.assign(conn, :current_company, company)
        else
          _ -> conn
        end
    end
  end

  defp ensure_current_person(conn) do
    case conn.assigns[:current_person] do
      %People.Person{} ->
        conn

      _ ->
        with account when not is_nil(account) <- Map.get(conn.assigns, :current_account),
             %Companies.Company{} = company <- conn.assigns[:current_company] do
          Plug.Conn.assign(conn, :current_person, People.get_person!(account, company))
        else
          _ -> conn
        end
    end
  end
end
