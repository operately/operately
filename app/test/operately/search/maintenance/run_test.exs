defmodule Operately.Search.Maintenance.RunTest do
  use Operately.DataCase, async: true

  test "stores superseded maintenance counts" do
    assert [["NO", "0"]] =
             Repo.query!("SELECT is_nullable, column_default FROM information_schema.columns WHERE table_name = 'search_index_runs' AND column_name = 'superseded_count'").rows
  end
end
