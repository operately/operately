defmodule Operately.ApiDocs.GeneratorTest do
  use ExUnit.Case

  alias Operately.ApiDocs.Generator

  setup do
    out_dir = Path.join(System.tmp_dir!(), "operately_api_docs_#{System.unique_integer([:positive])}")

    on_exit(fn ->
      File.rm_rf(out_dir)
    end)

    %{out_dir: out_dir}
  end

  test "generates one page per external endpoint plus namespace indexes", %{out_dir: out_dir} do
    result = Generator.generate(out_dir: out_dir)

    expected_count =
      map_size(OperatelyWeb.Api.External.__queries__()) +
        map_size(OperatelyWeb.Api.External.__mutations__())

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
end
