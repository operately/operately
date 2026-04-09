defmodule Operately.CompanyTransfers.Package.PathsTest do
  use ExUnit.Case, async: true

  alias Operately.CompanyTransfers.Package.Paths

  describe "workspace/2 with valid UUID" do
    test "builds export workspace path with valid UUID" do
      run_id = "550e8400-e29b-41d4-a716-446655440000"
      path = Paths.workspace(:export, run_id)

      assert String.ends_with?(path, "/workspaces/exports/#{run_id}")
    end

    test "builds import workspace path with valid UUID" do
      run_id = "123e4567-e89b-12d3-a456-426614174000"
      path = Paths.workspace(:import, run_id)

      assert String.ends_with?(path, "/workspaces/imports/#{run_id}")
    end
  end

  describe "workspace/2 security validation" do
    test "rejects path traversal attempt with ../" do
      run_id = "../../../etc/passwd"

      assert_raise ArgumentError, ~r/Invalid run_id format: expected UUID/, fn ->
        Paths.workspace(:export, run_id)
      end
    end

    test "rejects absolute path attempt" do
      run_id = "/etc/passwd"

      assert_raise ArgumentError, ~r/Invalid run_id format: expected UUID/, fn ->
        Paths.workspace(:import, run_id)
      end
    end

    test "rejects run_id with path separators" do
      run_id = "foo/bar/baz"

      assert_raise ArgumentError, ~r/Invalid run_id format: expected UUID/, fn ->
        Paths.workspace(:export, run_id)
      end
    end

    test "rejects run_id with backslash separators" do
      run_id = "foo\\bar\\baz"

      assert_raise ArgumentError, ~r/Invalid run_id format: expected UUID/, fn ->
        Paths.workspace(:import, run_id)
      end
    end

    test "rejects non-UUID strings" do
      run_id = "not-a-uuid-at-all"

      assert_raise ArgumentError, ~r/Invalid run_id format: expected UUID/, fn ->
        Paths.workspace(:export, run_id)
      end
    end

    test "rejects empty string" do
      run_id = ""

      assert_raise ArgumentError, ~r/Invalid run_id format: expected UUID/, fn ->
        Paths.workspace(:export, run_id)
      end
    end

    test "accepts lowercase UUID" do
      run_id = "550e8400-e29b-41d4-a716-446655440000"

      assert Paths.workspace(:export, run_id)
    end

    test "accepts uppercase UUID" do
      run_id = "550E8400-E29B-41D4-A716-446655440000"

      assert Paths.workspace(:export, run_id)
    end

    test "accepts mixed case UUID" do
      run_id = "550e8400-E29B-41d4-A716-446655440000"

      assert Paths.workspace(:export, run_id)
    end
  end

  describe "staged_json_path/2 and staged_zip_path/2" do
    test "inherit security validation from workspace/2" do
      run_id = "../../../etc/passwd"

      assert_raise ArgumentError, ~r/Invalid run_id format: expected UUID/, fn ->
        Paths.staged_json_path(:export, run_id)
      end

      assert_raise ArgumentError, ~r/Invalid run_id format: expected UUID/, fn ->
        Paths.staged_zip_path(:import, run_id)
      end
    end
  end

  describe "export_artifact_* functions security validation" do
    test "export_artifact_dir/1 rejects path traversal" do
      run_id = "../../../etc/passwd"

      assert_raise ArgumentError, ~r/Invalid run_id format: expected UUID/, fn ->
        Paths.export_artifact_dir(run_id)
      end
    end

    test "export_artifact_json_key/1 rejects path traversal" do
      run_id = "../../foo"

      assert_raise ArgumentError, ~r/Invalid run_id format: expected UUID/, fn ->
        Paths.export_artifact_json_key(run_id)
      end
    end

    test "export_artifact_zip_key/1 rejects path traversal" do
      run_id = "/etc/passwd"

      assert_raise ArgumentError, ~r/Invalid run_id format: expected UUID/, fn ->
        Paths.export_artifact_zip_key(run_id)
      end
    end

    test "export_artifact_json_path/1 rejects path traversal" do
      run_id = "../../../etc/passwd"

      assert_raise ArgumentError, ~r/Invalid run_id format: expected UUID/, fn ->
        Paths.export_artifact_json_path(run_id)
      end
    end

    test "export_artifact_zip_path/1 rejects path traversal" do
      run_id = "foo/bar/baz"

      assert_raise ArgumentError, ~r/Invalid run_id format: expected UUID/, fn ->
        Paths.export_artifact_zip_path(run_id)
      end
    end

    test "export_artifact functions work with valid UUID" do
      run_id = "550e8400-e29b-41d4-a716-446655440000"

      assert Paths.export_artifact_dir(run_id)
      assert Paths.export_artifact_json_key(run_id) == "exports/#{run_id}/data.json"
      assert Paths.export_artifact_zip_key(run_id) == "exports/#{run_id}/files.zip"
      assert Paths.export_artifact_json_path(run_id)
      assert Paths.export_artifact_zip_path(run_id)
    end
  end
end
