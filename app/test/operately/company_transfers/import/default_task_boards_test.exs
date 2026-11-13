defmodule Operately.CompanyTransfers.Import.DefaultTaskBoardsTest do
  use ExUnit.Case, async: true
  alias Operately.CompanyTransfers.Import.{Package, DefaultTaskBoards}

  test "existing project boards remain authoritative and conflicting ownership is rejected" do
    project = %{"id" => "project", "task_statuses" => [], "tasks_kanban_state" => %{}}
    board = %{"id" => "board", "project_id" => "project", "task_statuses" => [%{"id" => "review"}], "tasks_kanban_state" => %{"review" => ["task"]}}
    tables = [
      %{"name" => "projects", "rows" => [project]},
      %{"name" => "task_boards", "rows" => [board]},
      %{"name" => "tasks", "rows" => [%{"id" => "task", "project_id" => "project", "board_id" => "board", "archived_at" => "2020-01-01"}]}
    ]
    package = %Package{tables: tables, table_map: Map.new(tables, &{&1["name"], &1})}
    normalized = DefaultTaskBoards.normalize(package)
    assert Package.table_rows(normalized, "task_boards") == [board]
    assert Package.table_rows(normalized, "projects") == [%{"id" => "project"}]
    assert DefaultTaskBoards.normalize(normalized) == normalized
    assert :ok = DefaultTaskBoards.validate(normalized)

    invalid_tables = Enum.map(tables, fn table ->
      if table["name"] == "tasks", do: Map.put(table, "rows", [%{"id" => "task", "project_id" => "other", "board_id" => "board"}]), else: table
    end)
    invalid = %Package{tables: invalid_tables, table_map: Map.new(invalid_tables, &{&1["name"], &1})}
    assert {:error, :invalid_task_board_ownership} = invalid |> DefaultTaskBoards.normalize() |> DefaultTaskBoards.validate()
  end

  test "initializes older packages once, preserving raw state and timestamps" do
    space = %{
      "id" => "space",
      "task_statuses" => [%{"id" => "custom", "extra" => "preserved"}],
      "tasks_kanban_state" => %{"custom" => ["task"]},
      "inserted_at" => "2020-01-01",
      "updated_at" => "2021-01-01"
    }

    tasks = [%{"id" => "task", "space_id" => "space", "archived_at" => "2022-01-01"}, %{"id" => "project-task", "project_id" => "project"}]
    tables = [%{"name" => "groups", "rows" => [space]}, %{"name" => "projects", "rows" => [%{"id" => "project"}]}, %{"name" => "tasks", "rows" => tasks}]
    package = %Package{tables: tables, table_map: Map.new(tables, &{&1["name"], &1})}
    normalized = DefaultTaskBoards.normalize(package)
    boards = Package.table_rows(normalized, "task_boards")
    board = Enum.find(boards, & &1["space_id"])
    project_board = Enum.find(boards, & &1["project_id"])
    [updated_space] = Package.table_rows(normalized, "groups")
    [task, project_task] = Package.table_rows(normalized, "tasks")
    assert Map.take(board, ["task_statuses", "tasks_kanban_state", "inserted_at", "updated_at"]) == Map.take(space, ["task_statuses", "tasks_kanban_state", "inserted_at", "updated_at"])
    assert updated_space["default_task_board_id"] == board["id"]
    refute Map.has_key?(updated_space, "task_statuses")
    refute Map.has_key?(updated_space, "tasks_kanban_state")
    assert task == Map.put(hd(tasks), "board_id", board["id"])
    assert project_task == Map.put(List.last(tasks), "board_id", project_board["id"])
    assert DefaultTaskBoards.normalize(normalized) == normalized
    assert :ok == DefaultTaskBoards.validate(normalized)
  end

  test "removes legacy fields without overwriting existing board state" do
    space = %{"id" => "space", "default_task_board_id" => "board", "task_statuses" => [], "tasks_kanban_state" => %{}}
    board = %{"id" => "board", "space_id" => "space", "task_statuses" => [%{"id" => "custom"}], "tasks_kanban_state" => %{"custom" => ["task"]}}
    tables = [%{"name" => "groups", "rows" => [space]}, %{"name" => "task_boards", "rows" => [board]}]
    package = %Package{tables: tables, table_map: Map.new(tables, &{&1["name"], &1})}

    normalized = DefaultTaskBoards.normalize(package)

    assert Package.table_rows(normalized, "groups") == [Map.drop(space, ["task_statuses", "tasks_kanban_state"])]
    assert Package.table_rows(normalized, "task_boards") == [board]
    assert DefaultTaskBoards.normalize(normalized) == normalized
  end

  test "rejects cross-space board references without replacing them" do
    tables = [
      %{"name" => "groups", "rows" => [%{"id" => "space", "default_task_board_id" => "board"}]},
      %{"name" => "task_boards", "rows" => [%{"id" => "board", "space_id" => "other"}]}
    ]

    package = %Package{tables: tables, table_map: Map.new(tables, &{&1["name"], &1})}
    assert DefaultTaskBoards.normalize(package) == package
    assert {:error, :invalid_task_board_ownership} = DefaultTaskBoards.validate(package)
  end
end
