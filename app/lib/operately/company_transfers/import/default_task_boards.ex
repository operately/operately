defmodule Operately.CompanyTransfers.Import.DefaultTaskBoards do
  @moduledoc "Prepares legacy space task state before IDs and ordering references are remapped."
  alias Operately.CompanyTransfers.Import.Package

  def normalize(%Package{} = package) do
    boards = Package.table_rows(package, "task_boards")

    {spaces, boards} =
      Enum.map_reduce(Package.table_rows(package, "groups"), boards, fn space, boards ->
        if space["default_task_board_id"] do
          {space, boards}
        else
          board = %{
            "id" => Ecto.UUID.generate(),
            "space_id" => space["id"],
            "name" => "Tasks",
            "position" => 0,
            "task_statuses" => space["task_statuses"],
            "tasks_kanban_state" => space["tasks_kanban_state"],
            "archived_at" => nil,
            "inserted_at" => space["inserted_at"],
            "updated_at" => space["updated_at"]
          }

          {Map.put(space, "default_task_board_id", board["id"]), [board | boards]}
        end
      end)

    defaults = Map.new(spaces, &{&1["id"], &1["default_task_board_id"]})

    tasks =
      Enum.map(Package.table_rows(package, "tasks"), fn task ->
        if task["space_id"] && is_nil(task["project_id"]) && is_nil(task["board_id"]), do: Map.put(task, "board_id", defaults[task["space_id"]]), else: task
      end)

    replacements = %{"groups" => spaces, "task_boards" => boards, "tasks" => tasks}

    tables =
      Enum.map(package.tables, fn table ->
        if Map.has_key?(replacements, table["name"]), do: Map.put(table, "rows", replacements[table["name"]]), else: table
      end)

    tables = if Package.table(package, "task_boards"), do: tables, else: tables ++ [%{"name" => "task_boards", "rows" => boards}]

    %{package | tables: tables, table_map: Map.new(tables, &{&1["name"], &1})}
  end

  def validate(package) do
    boards = Map.new(Package.table_rows(package, "task_boards"), &{&1["id"], &1})

    valid_spaces =
      Enum.all?(Package.table_rows(package, "groups"), fn space ->
        board = boards[space["default_task_board_id"]]
        board && board["space_id"] == space["id"] && is_nil(board["archived_at"])
      end)

    valid_tasks =
      Enum.all?(Package.table_rows(package, "tasks"), fn task ->
        cond do
          task["project_id"] ->
            is_nil(task["board_id"])

          task["space_id"] ->
            board = boards[task["board_id"]]
            board && board["space_id"] == task["space_id"]

          true ->
            is_nil(task["board_id"])
        end
      end)

    if valid_spaces && valid_tasks, do: :ok, else: {:error, :invalid_task_board_ownership}
  end
end
