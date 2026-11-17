defmodule Operately.CompanyTransfers.Import.DefaultResourceHubsTest do
  use ExUnit.Case, async: true
  alias Operately.CompanyTransfers.Import.{DefaultResourceHubs, Package}

  test "older packages gain stable defaults and existing selections survive" do
    groups = [%{"id" => "a"}, %{"id" => "b", "default_resource_hub_id" => "chosen"}, %{"id" => "empty"}]
    hubs = [%{"id" => "2", "space_id" => "a", "inserted_at" => "2020"}, %{"id" => "1", "space_id" => "a", "inserted_at" => "2020"}]
    tables = [%{"name" => "groups", "rows" => groups}, %{"name" => "resource_hubs", "rows" => hubs}]
    package = %Package{tables: tables, table_map: Map.new(tables, &{&1["name"], &1})}

    result = DefaultResourceHubs.normalize(package)

    assert [%{"default_resource_hub_id" => "1"}, %{"default_resource_hub_id" => "chosen"}, %{"default_resource_hub_id" => nil}] = Package.table(result, "groups")["rows"]
    assert Enum.map(Package.table(result, "resource_hubs")["rows"], & &1["position"]) == [1, 0]
    assert DefaultResourceHubs.normalize(result) == result
  end

  test "preserves saved positions independently of default initialization" do
    hubs = [%{"id" => "old", "space_id" => "space", "inserted_at" => "2020", "position" => 7},
            %{"id" => "active", "space_id" => "space", "inserted_at" => "2022", "position" => 2}]
    tables = [%{"name" => "groups", "rows" => [%{"id" => "space"}]}, %{"name" => "resource_hubs", "rows" => hubs}]
    result = DefaultResourceHubs.normalize(%Package{tables: tables, table_map: Map.new(tables, &{&1["name"], &1})})
    assert [%{"default_resource_hub_id" => "old"}] = Package.table(result, "groups")["rows"]
    assert Package.table(result, "resource_hubs")["rows"] == hubs
  end

  test "resolves tied positions by source creation time and ID without changing other spaces" do
    hubs = [
      %{"id" => "a", "space_id" => "space", "inserted_at" => "2022", "position" => 0},
      %{"id" => "c", "space_id" => "space", "inserted_at" => "2020", "position" => 0},
      %{"id" => "b", "space_id" => "space", "inserted_at" => "2020", "position" => 0},
      %{"id" => "d", "space_id" => "space", "inserted_at" => "2023", "position" => 1},
      %{"id" => "e", "space_id" => "space", "inserted_at" => "2019", "position" => 8},
      %{"id" => "other", "space_id" => "other-space", "position" => 0},
      %{"id" => "project", "space_id" => nil, "position" => 0}
    ]
    tables = [%{"name" => "resource_hubs", "rows" => hubs}]
    package = %Package{tables: tables, table_map: Map.new(tables, &{&1["name"], &1})}

    result = DefaultResourceHubs.normalize(package)
    positions = Map.new(Package.table(result, "resource_hubs")["rows"], &{&1["id"], &1["position"]})

    assert positions == %{"b" => 0, "c" => 1, "a" => 2, "d" => 3, "e" => 8, "other" => 0, "project" => 0}
    assert DefaultResourceHubs.normalize(result) == result
  end

end
