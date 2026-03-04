defmodule Mix.Tasks.Operately.Gen.Api.DocsTest do
  use ExUnit.Case

  import ExUnit.CaptureIO

  test "generates docs in the requested directory and prints summary" do
    out_dir = Path.join(System.tmp_dir!(), "operately_mix_api_docs_#{System.unique_integer([:positive])}")

    on_exit(fn ->
      File.rm_rf(out_dir)
    end)

    Mix.Task.reenable("operately.gen.api.docs")

    output =
      capture_io(fn ->
        Mix.Task.run("operately.gen.api.docs", ["--out-dir", out_dir])
      end)

    assert output =~ "Generated API docs from OperatelyWeb.Api.External"
    assert output =~ out_dir
    assert output =~ "Manual copy example"

    assert File.exists?(Path.join(out_dir, "help/api/index.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/get_account.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/root/index.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/external/index.mdx"))
  end

  test "raises for unknown options" do
    Mix.Task.reenable("operately.gen.api.docs")

    assert_raise Mix.Error, ~r/Unknown option\(s\): --unknown/, fn ->
      Mix.Task.run("operately.gen.api.docs", ["--unknown", "value"])
    end
  end
end
