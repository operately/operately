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
end
