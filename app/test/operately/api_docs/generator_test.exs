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
    assert File.exists?(Path.join(out_dir, "help/api/get_account.mdx"))
    assert File.exists?(Path.join(out_dir, "help/api/goals/index.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/root/index.mdx"))
    refute File.exists?(Path.join(out_dir, "help/api/external/index.mdx"))
  end

  test "renders method and path for root and namespaced endpoints", %{out_dir: out_dir} do
    Generator.generate(out_dir: out_dir)

    root_endpoint = Path.join(out_dir, "help/api/get_account.mdx")
    namespaced_endpoint = Path.join(out_dir, "help/api/goals/update_name.mdx")

    root_page = File.read!(root_endpoint)
    namespaced_page = File.read!(namespaced_endpoint)

    assert root_page =~ "| Type | `query` |"
    assert root_page =~ "| Method | `GET` |"
    assert root_page =~ "| Path | `/api/external/v1/get_account` |"
    assert root_page =~ ~s(import CurlExampleBlock from "@components/CurlExampleBlock.jsx")
    assert root_page =~ "## cURL Example"
    assert root_page =~ "<CurlExampleBlock client:load command={"
    assert root_page =~ "curl --request GET"
    assert root_page =~ "https://app.operately.com/api/external/v1/get_account"
    assert root_page =~ "Authorization: Bearer ${OPERATELY_API_TOKEN}"
    assert root_page =~ "## Response Example"
    assert root_page =~ "```json"

    assert namespaced_page =~ "| Type | `mutation` |"
    assert namespaced_page =~ "| Method | `POST` |"
    assert namespaced_page =~ "| Path | `/api/external/v1/goals/update_name` |"
    assert namespaced_page =~ "## cURL Example"
    assert namespaced_page =~ "<CurlExampleBlock client:load command={"
    assert namespaced_page =~ "curl --request POST"
    assert namespaced_page =~ "https://app.operately.com/api/external/v1/goals/update_name"
    assert namespaced_page =~ "Authorization: Bearer ${OPERATELY_API_TOKEN}"
    assert namespaced_page =~ "Content-Type: application/json"
    assert namespaced_page =~ ~s(--data ')
    assert namespaced_page =~ "## Response Example"
    assert namespaced_page =~ "```json"

    {root_curl_pos, _} = :binary.match(root_page, "## cURL Example")
    {root_response_pos, _} = :binary.match(root_page, "## Response Example")
    assert root_curl_pos < root_response_pos

    {namespaced_curl_pos, _} = :binary.match(namespaced_page, "## cURL Example")
    {namespaced_response_pos, _} = :binary.match(namespaced_page, "## Response Example")
    assert namespaced_curl_pos < namespaced_response_pos
  end

  test "removes stale files when regenerating", %{out_dir: out_dir} do
    Generator.generate(out_dir: out_dir)

    stale_file = Path.join(out_dir, "help/api/stale_endpoint.mdx")
    File.write!(stale_file, "stale")
    assert File.exists?(stale_file)

    Generator.generate(out_dir: out_dir)
    refute File.exists?(stale_file)
  end
end
