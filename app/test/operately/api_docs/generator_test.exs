defmodule Operately.ApiDocs.GeneratorTest do
  use ExUnit.Case

  alias Operately.ApiDocs.{Catalog, Generator}

  setup do
    out_dir = Path.join(System.tmp_dir!(), "operately_api_docs_#{System.unique_integer([:positive])}")

    on_exit(fn ->
      File.rm_rf(out_dir)
    end)

    %{out_dir: out_dir}
  end

  test "generates one page per external endpoint plus namespace indexes", %{out_dir: out_dir} do
    result = Generator.generate(out_dir: out_dir)
    catalog = Generator.build_catalog(OperatelyWeb.Api.External, "/api/external/v1")

    expected_count = length(catalog.endpoints)

    endpoint_files =
      Path.wildcard(Path.join(out_dir, "help/api/**/*.mdx"))
      |> Enum.reject(&(Path.basename(&1) == "index.mdx"))

    assert result.endpoint_count == expected_count
    assert length(endpoint_files) == expected_count

    assert File.exists?(Path.join(out_dir, "help/api/index.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/people/get_account.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/goals/index.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/root/index.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/external/index.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/people/update_picture.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/create_avatar_blob.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/create_blob.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/mark_blob_uploaded.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/files/create.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/files/get.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/files/update.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/files/delete.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/documents/create.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/links/create.mdx"))
  end

  test "renders method and path for root and namespaced endpoints", %{out_dir: out_dir} do
    Generator.generate(out_dir: out_dir)

    namespaced_endpoint_1 = Path.join(out_dir, "help/api/people/get_account.mdx")
    namespaced_endpoint_2 = Path.join(out_dir, "help/api/goals/update_name.mdx")

    page_1 = File.read!(namespaced_endpoint_1)
    page_2 = File.read!(namespaced_endpoint_2)

    assert page_1 =~ ~s(title: "People API: Get account")
    assert page_1 =~ ~s(description: "Get account with the Operately People API.")
    assert page_1 =~ "| Type | `query` |"
    assert page_1 =~ "| Method | `GET` |"
    assert page_1 =~ "| Path | `/api/external/v1/people/get_account` |"
    assert page_1 =~ ~s(import CurlExampleBlock from "@components/CurlExampleBlock.jsx")
    assert page_1 =~ "## cURL Example"
    assert page_1 =~ "<CurlExampleBlock client:load command={"
    assert page_1 =~ "curl --request GET"
    assert page_1 =~ "https://app.operately.com/api/external/v1/people/get_account"
    assert page_1 =~ "Authorization: Bearer ${OPERATELY_API_TOKEN}"
    assert page_1 =~ "## Response Example"
    assert page_1 =~ "```json"

    assert page_2 =~ ~s(title: "Goals API: Update name")
    assert page_2 =~ ~s(description: "Update name with the Operately Goals API.")
    assert page_2 =~ "| Type | `mutation` |"
    assert page_2 =~ "| Method | `POST` |"
    assert page_2 =~ "| Path | `/api/external/v1/goals/update_name` |"
    assert page_2 =~ "## cURL Example"
    assert page_2 =~ "<CurlExampleBlock client:load command={"
    assert page_2 =~ "curl --request POST"
    assert page_2 =~ "https://app.operately.com/api/external/v1/goals/update_name"
    assert page_2 =~ "Authorization: Bearer ${OPERATELY_API_TOKEN}"
    assert page_2 =~ "Content-Type: application/json"
    assert page_2 =~ ~s(--data ')
    assert page_2 =~ "## Response Example"
    assert page_2 =~ "```json"

    {page_1_curl_pos, _} = :binary.match(page_1, "## cURL Example")
    {page_1_response_pos, _} = :binary.match(page_1, "## Response Example")
    assert page_1_curl_pos < page_1_response_pos

    {page_2_curl_pos, _} = :binary.match(page_2, "## cURL Example")
    {page_2_response_pos, _} = :binary.match(page_2, "## Response Example")
    assert page_2_curl_pos < page_2_response_pos
  end

  test "removes stale files when regenerating", %{out_dir: out_dir} do
    Generator.generate(out_dir: out_dir)

    stale_file = Path.join(out_dir, "help/api/stale_endpoint.mdx")
    File.write!(stale_file, "stale")
    assert File.exists?(stale_file)

    Generator.generate(out_dir: out_dir)
    refute File.exists?(stale_file)
  end

  test "generate/1 is docs-only and does not write catalog files", %{out_dir: out_dir} do
    result = Generator.generate(out_dir: out_dir)

    refute Map.has_key?(result, :catalog_path)
    refute Map.has_key?(result, :cli_catalog_path)
    refute File.exists?(Path.join(out_dir, "help/api/catalog.json"))
  end

  test "generate_catalog/1 writes docs and cli catalog files", %{out_dir: out_dir} do
    cli_catalog_path = Path.join(out_dir, "cli/api-catalog.json") |> Path.expand()

    result =
      Generator.generate_catalog(
        out_dir: out_dir,
        cli_catalog_path: cli_catalog_path
      )

    assert result.catalog_path == Path.join(out_dir, "help/api/catalog.json")
    assert result.cli_catalog_path == cli_catalog_path
    assert File.exists?(result.catalog_path)
    assert File.exists?(result.cli_catalog_path)

    docs_catalog = result.catalog_path |> File.read!() |> Jason.decode!()
    cli_catalog = result.cli_catalog_path |> File.read!() |> Jason.decode!()

    assert docs_catalog == cli_catalog
    assert docs_catalog["endpoint_count"] == result.endpoint_count
  end

  test "build_catalog uses the effective default for the selected api module" do
    external_catalog = Generator.build_catalog(OperatelyWeb.Api.External, "/api/external/v1")
    internal_catalog = Generator.build_catalog(OperatelyWeb.Api.Internal, "/api/v2")

    external_field = find_input_field(external_catalog, "spaces/create_discussion", :send_notifications_to_everyone)
    internal_field = find_input_field(internal_catalog, "spaces/create_discussion", :send_notifications_to_everyone)

    assert external_field == {:send_notifications_to_everyone, :boolean, [default: true, optional: true, null: false]}
    assert internal_field == {:send_notifications_to_everyone, :boolean, [default: false, optional: true, null: false]}
  end

  test "catalog payload keeps the existing field shape while exposing the effective external default" do
    catalog = Generator.build_catalog(OperatelyWeb.Api.External, "/api/external/v1")
    payload = Catalog.payload(catalog, "/api/external/v1")

    field =
      payload.endpoints
      |> Enum.find(&(&1.full_name == "spaces/create_discussion"))
      |> Map.fetch!(:inputs)
      |> Enum.find(&(&1.name == "send_notifications_to_everyone"))

    assert field.default == "true"
    assert field.has_default == true
    assert Enum.sort(Map.keys(field)) == [:default, :has_default, :name, :nullable, :optional, :type]
  end

  test "hidden external endpoints are routable but excluded from catalog and docs", %{out_dir: out_dir} do
    external_mutations = OperatelyWeb.Api.External.__mutations__()
    assert Map.has_key?(external_mutations, "create_avatar_blob")
    assert Map.has_key?(external_mutations, "create_blob")
    assert Map.has_key?(external_mutations, "mark_blob_uploaded")
    assert Map.has_key?(external_mutations, "people/update_picture")
    assert Map.has_key?(external_mutations, "files/create")
    assert Map.has_key?(external_mutations, "files/update")
    assert Map.has_key?(external_mutations, "files/delete")
    assert Map.has_key?(OperatelyWeb.Api.External.__queries__(), "files/get")

    catalog = Generator.build_catalog(OperatelyWeb.Api.External, "/api/external/v1")
    refute Enum.any?(catalog.endpoints, &(&1.full_name == "create_avatar_blob"))
    refute Enum.any?(catalog.endpoints, &(&1.full_name == "create_blob"))
    refute Enum.any?(catalog.endpoints, &(&1.full_name == "mark_blob_uploaded"))
    refute Enum.any?(catalog.endpoints, &(&1.full_name == "people/update_picture"))
    refute Enum.any?(catalog.endpoints, &(&1.full_name == "files/create"))
    assert Enum.any?(catalog.endpoints, &(&1.full_name == "files/get"))
    assert Enum.any?(catalog.endpoints, &(&1.full_name == "files/update"))
    assert Enum.any?(catalog.endpoints, &(&1.full_name == "files/delete"))

    Generator.generate(out_dir: out_dir)
    refute File.exists?(Path.join(out_dir, "help/api/create_avatar_blob.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/create_blob.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/mark_blob_uploaded.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/people/update_picture.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/files/create.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/files/get.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/files/update.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/files/delete.mdx"))
    refute Enum.any?(Catalog.payload(catalog, "/api/external/v1").endpoints, &(&1.full_name == "create_avatar_blob"))
    refute Enum.any?(Catalog.payload(catalog, "/api/external/v1").endpoints, &(&1.full_name == "create_blob"))
    refute Enum.any?(Catalog.payload(catalog, "/api/external/v1").endpoints, &(&1.full_name == "mark_blob_uploaded"))
    refute Enum.any?(Catalog.payload(catalog, "/api/external/v1").endpoints, &(&1.full_name == "people/update_picture"))
    refute Enum.any?(Catalog.payload(catalog, "/api/external/v1").endpoints, &(&1.full_name == "files/create"))
    assert Enum.any?(Catalog.payload(catalog, "/api/external/v1").endpoints, &(&1.full_name == "files/get"))
    assert Enum.any?(Catalog.payload(catalog, "/api/external/v1").endpoints, &(&1.full_name == "files/update"))
    assert Enum.any?(Catalog.payload(catalog, "/api/external/v1").endpoints, &(&1.full_name == "files/delete"))
  end

  test "legacy endpoints with docs_and_files wrappers are routable but excluded from catalog and docs", %{out_dir: out_dir} do
    external_queries = OperatelyWeb.Api.External.__queries__()
    external_mutations = OperatelyWeb.Api.External.__mutations__()

    assert Map.has_key?(external_queries, "resource_hubs/get")
    assert Map.has_key?(external_queries, "resource_hubs/list_nodes")
    assert Map.has_key?(external_mutations, "resource_hubs/create_folder")
    assert Map.has_key?(external_mutations, "documents/create")
    assert Map.has_key?(external_mutations, "links/create")
    assert Map.has_key?(external_mutations, "files/create")

    catalog = Generator.build_catalog(OperatelyWeb.Api.External, "/api/external/v1")

    refute Enum.any?(catalog.endpoints, &(&1.full_name == "resource_hubs/get"))
    refute Enum.any?(catalog.endpoints, &(&1.full_name == "resource_hubs/list_nodes"))
    refute Enum.any?(catalog.endpoints, &(&1.full_name == "resource_hubs/create_folder"))
    refute Enum.any?(catalog.endpoints, &(&1.full_name == "resource_hubs/get_folder"))
    refute Enum.any?(catalog.endpoints, &(&1.full_name == "resource_hubs/copy_folder"))
    assert Enum.any?(catalog.endpoints, &(&1.full_name == "documents/create"))
    assert Enum.any?(catalog.endpoints, &(&1.full_name == "links/create"))
    refute Enum.any?(catalog.endpoints, &(&1.full_name == "files/create"))
    assert Enum.any?(catalog.endpoints, &(&1.full_name == "documents/get"))
    assert Enum.any?(catalog.endpoints, &(&1.full_name == "links/get"))
    assert Enum.any?(catalog.endpoints, &(&1.full_name == "files/get"))
    refute Enum.any?(catalog.endpoints, &(&1.full_name == "docs_and_files/get"))
    assert Enum.any?(catalog.endpoints, &(&1.full_name == "docs_and_files/list_contents"))
    assert Enum.any?(catalog.endpoints, &(&1.full_name == "docs_and_files/create_folder"))
    assert Enum.any?(catalog.endpoints, &(&1.full_name == "docs_and_files/get_folder"))
    assert Enum.any?(catalog.endpoints, &(&1.full_name == "docs_and_files/copy_folder"))

    Generator.generate(out_dir: out_dir)
    refute File.exists?(Path.join(out_dir, "help/api/resource_hubs/index.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/resource_hubs/get.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/resource_hubs/get_folder.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/documents/index.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/documents/create.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/documents/get.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/links/index.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/links/create.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/files/index.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/files/create.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/docs_and_files/index.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/docs_and_files/get.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/docs_and_files/create_folder.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/docs_and_files/get_folder.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/docs_and_files/copy_folder.mdx"))
  end

  defp find_input_field(catalog, full_name, field_name) do
    catalog.endpoints
    |> Enum.find(&(&1.full_name == full_name))
    |> Map.fetch!(:inputs)
    |> Enum.find(fn {name, _, _} -> name == field_name end)
  end
end
