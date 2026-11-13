defmodule Operately.CompanyTransfers.Import.DefaultTaskBoards do
  @moduledoc "Prepares legacy space and project task state before IDs and ordering references are remapped."
  alias Operately.CompanyTransfers.Import.Package

  def normalize(%Package{} = package) do
    boards = Package.table_rows(package, "task_boards")

    {spaces, boards} =
      Enum.map_reduce(Package.table_rows(package, "groups"), boards, fn space, boards ->
        if space["default_task_board_id"] do
          {space, boards}
        else
          board = legacy_board(space, "space_id")

          {Map.put(space, "default_task_board_id", board["id"]), [board | boards]}
        end
      end)

    spaces = Enum.map(spaces, &Map.drop(&1, ["task_statuses", "tasks_kanban_state"]))
    defaults = Map.new(spaces, &{&1["id"], &1["default_task_board_id"]})

    {projects, boards} = normalize_projects(Package.table_rows(package, "projects"), boards)

    project_boards = boards |> Enum.filter(& &1["project_id"]) |> Map.new(&{&1["project_id"], &1["id"]})

    tasks =
      Enum.map(Package.table_rows(package, "tasks"), fn task ->
        board_id = task["board_id"] || if(task["project_id"], do: project_boards[task["project_id"]], else: defaults[task["space_id"]])
        Map.put(task, "board_id", board_id)
      end)

    replacements = %{"groups" => spaces, "projects" => projects, "task_boards" => boards, "tasks" => tasks}

    tables =
      Enum.map(package.tables, fn table ->
        if Map.has_key?(replacements, table["name"]), do: Map.put(table, "rows", replacements[table["name"]]), else: table
      end)

    tables = if Package.table(package, "task_boards"), do: tables, else: tables ++ [%{"name" => "task_boards", "rows" => boards}]

    %{package | tables: tables, table_map: Map.new(tables, &{&1["name"], &1})}
  end

  defp normalize_projects(projects, boards) do
    existing = MapSet.new(boards, & &1["project_id"])

    Enum.map_reduce(projects, boards, fn project, boards ->
      boards = if MapSet.member?(existing, project["id"]), do: boards, else: [legacy_board(project, "project_id") | boards]
      {Map.drop(project, ["task_statuses", "tasks_kanban_state"]), boards}
    end)
  end

  defp legacy_board(owner, owner_key) do
    %{
      "id" => Ecto.UUID.generate(),
      owner_key => owner["id"],
      "name" => "Tasks",
      "position" => 0,
      "archived_at" => nil,
      "task_statuses" => owner["task_statuses"],
      "tasks_kanban_state" => owner["tasks_kanban_state"],
      "inserted_at" => owner["inserted_at"],
      "updated_at" => owner["updated_at"]
    }
  end

  def validate(package) do
    boards = Map.new(Package.table_rows(package, "task_boards"), &{&1["id"], &1})

    valid_spaces =
      Enum.all?(Package.table_rows(package, "groups"), fn space ->
        board = boards[space["default_task_board_id"]]
        board && board["space_id"] == space["id"] && is_nil(board["archived_at"])
      end)

    projects = MapSet.new(Package.table_rows(package, "projects"), & &1["id"])
    spaces = MapSet.new(Package.table_rows(package, "groups"), & &1["id"])
    project_boards = boards |> Map.values() |> Enum.filter(& &1["project_id"])

    valid_boards =
      Enum.all?(Map.values(boards), fn board ->
        case {board["space_id"], board["project_id"]} do
          {nil, id} when not is_nil(id) -> MapSet.member?(projects, id) && is_nil(board["archived_at"])
          {id, nil} when not is_nil(id) -> MapSet.member?(spaces, id)
          _ -> false
        end
      end)

    valid_projects =
      length(project_boards) == MapSet.size(projects) && MapSet.new(project_boards, & &1["project_id"]) == projects

    milestones = Map.new(Package.table_rows(package, "project_milestones"), &{&1["id"], &1["project_id"]})

    valid_tasks =
      Enum.all?(Package.table_rows(package, "tasks"), fn task ->
        cond do
          task["project_id"] ->
            board = boards[task["board_id"]]
            board && board["project_id"] == task["project_id"] && is_nil(task["space_id"])

          task["space_id"] ->
            board = boards[task["board_id"]]
            board && board["space_id"] == task["space_id"]

          true ->
            false
        end
      end)

    valid_milestones =
      Enum.all?(Package.table_rows(package, "tasks"), fn task ->
        is_nil(task["milestone_id"]) || (not is_nil(task["project_id"]) && milestones[task["milestone_id"]] == task["project_id"])
      end)

    if valid_spaces && valid_projects && valid_boards && valid_tasks && valid_milestones, do: :ok, else: {:error, :invalid_task_board_ownership}
  end
end
