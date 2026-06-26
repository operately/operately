defmodule OperatelyWeb.McpControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.CompaniesFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.ResourceHubsFixtures
  import Operately.TasksFixtures

  alias Operately.Billing
  alias Operately.Mcp
  alias Operately.People
  alias OperatelyWeb.Mcp.Tools, as: McpTools

  setup do
    client = %{
      client_id: "https://client.example.com/oauth/client.json",
      client_name: "Example MCP Client",
      redirect_uris: ["https://client.example.com/callback"],
      token_endpoint_auth_method: "none"
    }

    previous_clients = Application.get_env(:operately, :mcp_oauth_clients)
    Application.put_env(:operately, :mcp_oauth_clients, [client])

    on_exit(fn ->
      Application.put_env(:operately, :mcp_oauth_clients, previous_clients)
    end)

    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)

    %{account: account, company: company, client: client}
  end

  test "returns a 401 challenge when authentication is missing" do
    conn =
      build_conn()
      |> put_req_header("accept", "application/json, text/event-stream")
      |> put_req_header("content-type", "application/json")
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "1",
        "method" => "initialize",
        "params" => %{
          "protocolVersion" => Mcp.latest_protocol_version(),
          "capabilities" => %{},
          "clientInfo" => %{"name" => "Example Client", "version" => "1.0.0"}
        }
      })

    assert conn.status == 401
    assert get_resp_header(conn, "www-authenticate") |> List.first() =~ "resource_metadata="
  end

  test "rejects invalid origins", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)

    conn =
      build_conn()
      |> put_req_header("accept", "application/json, text/event-stream")
      |> put_req_header("content-type", "application/json")
      |> put_req_header("authorization", "Bearer #{access_token}")
      |> put_req_header("origin", "https://evil.example.com")
      |> post("/mcp", initialize_request())

    assert conn.status == 403
  end

  test "initializes a session, accepts initialized notifications, and responds to ping", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)

    {initialize_conn, session_id} = initialize_session(access_token)
    initialize_body = Jason.decode!(initialize_conn.resp_body)

    assert initialize_conn.status == 200
    assert initialize_body["result"]["protocolVersion"] == Mcp.latest_protocol_version()
    assert initialize_body["result"]["capabilities"] == %{"tools" => %{"listChanged" => false}}
    assert is_binary(session_id)

    initialized_conn =
      build_conn()
      |> authenticated_mcp_headers(access_token)
      |> put_req_header("mcp-session-id", session_id)
      |> put_req_header("mcp-protocol-version", Mcp.latest_protocol_version())
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "method" => "notifications/initialized"
      })

    assert initialized_conn.status == 202

    ping_conn =
      build_conn()
      |> authenticated_mcp_headers(access_token)
      |> put_req_header("mcp-session-id", session_id)
      |> put_req_header("mcp-protocol-version", Mcp.latest_protocol_version())
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "2",
        "method" => "ping"
      })

    assert ping_conn.status == 200
    assert Jason.decode!(ping_conn.resp_body)["result"] == %{}

    tools_list_conn =
      build_conn()
      |> authenticated_mcp_headers(access_token)
      |> put_req_header("mcp-session-id", session_id)
      |> put_req_header("mcp-protocol-version", Mcp.latest_protocol_version())
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "3",
        "method" => "tools/list"
      })

    tools_list_body = Jason.decode!(tools_list_conn.resp_body)
    tool_names = tools_list_body["result"]["tools"] |> Enum.map(& &1["name"])
    search_tool = Enum.find(tools_list_body["result"]["tools"], &(&1["name"] == "search"))
    fetch_tool = Enum.find(tools_list_body["result"]["tools"], &(&1["name"] == "fetch"))

    assert tools_list_conn.status == 200

    assert tool_names == expected_tool_names()

    assert search_tool["outputSchema"]["type"] == "object"
    assert search_tool["_meta"]["examples"] != []
    assert search_tool["_meta"]["securitySchemes"] == [%{"type" => "oauth2", "scopes" => ["mcp:read"]}]
    assert fetch_tool["description"] =~ "/:company_id/projects/:project_id"
    assert fetch_tool["description"] =~ "/:company_id/goals/:goal_id"
    assert fetch_tool["inputSchema"]["properties"]["url"]["description"] =~ "Accepted paths:"
    assert fetch_tool["_meta"]["examples"] |> Enum.map(& &1["title"]) == [
             "Fetch a project page URL",
             "Fetch a goal page URL",
             "Fetch a milestone page URL",
             "Fetch a space page URL"
           ]

    assert fetch_tool["_meta"]["discoveryMetadata"]["acceptedUrlPatterns"] == [
             "/:company_id/projects/:project_id",
             "/:company_id/goals/:goal_id",
             "/:company_id/milestones/:milestone_id",
             "/:company_id/spaces/:space_id"
           ]

    create_comment_tool = Enum.find(tools_list_body["result"]["tools"], &(&1["name"] == "create_comment"))

    assert create_comment_tool["annotations"] == %{
             "readOnlyHint" => false,
             "destructiveHint" => false,
             "openWorldHint" => false
           }

    assert Enum.sort(create_comment_tool["inputSchema"]["properties"]["parent_type"]["enum"]) == Enum.sort([
             "goal_check_in",
             "project_check_in",
             "goal_discussion",
             "project_discussion",
             "space_discussion",
             "milestone",
             "document",
             "file",
             "link",
             "project_task",
             "space_task"
           ])

    assert create_comment_tool["_meta"]["securitySchemes"] == [%{"type" => "oauth2", "scopes" => ["mcp:write"]}]
    assert create_comment_tool["_meta"]["safetyClassification"] == "write"

    get_conn =
      build_conn()
      |> put_req_header("authorization", "Bearer #{access_token}")
      |> put_req_header("mcp-session-id", session_id)
      |> put_req_header("mcp-protocol-version", Mcp.latest_protocol_version())
      |> get("/mcp")

    assert get_conn.status == 405

    delete_conn =
      build_conn()
      |> put_req_header("authorization", "Bearer #{access_token}")
      |> put_req_header("mcp-session-id", session_id)
      |> put_req_header("mcp-protocol-version", Mcp.latest_protocol_version())
      |> delete("/mcp")

    assert delete_conn.status == 204

    closed_ping_conn =
      build_conn()
      |> authenticated_mcp_headers(access_token)
      |> put_req_header("mcp-session-id", session_id)
      |> put_req_header("mcp-protocol-version", Mcp.latest_protocol_version())
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "5",
        "method" => "ping"
      })

    assert closed_ping_conn.status == 404
  end

  test "executes get_current_company through tools/call", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)
    {_initialize_conn, session_id} = initialize_session(access_token)

    conn =
      build_conn()
      |> session_headers(access_token, session_id)
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "4",
        "method" => "tools/call",
        "params" => %{
          "name" => "get_current_company"
        }
      })

    body = Jason.decode!(conn.resp_body)

    assert conn.status == 200
    assert body["result"]["structuredContent"]["company"]["id"] == OperatelyWeb.Paths.company_id(company)
    assert body["result"]["structuredContent"]["company"]["name"] == company.name
    assert [%{"type" => "text", "text" => text}] = body["result"]["content"]
    assert Jason.decode!(text) == body["result"]["structuredContent"]
  end

  test "executes the live read-only tools through tools/call", %{account: account, company: company, client: client} do
    person = People.get_person(account, company)
    coworker = person_fixture(company_id: company.id, full_name: "Taylor Coworker")
    space = group_fixture(person, %{company_id: company.id, name: "Roadmap Space"})
    goal = goal_fixture(person, %{company_id: company.id, space_id: space.id, name: "Roadmap Goal"})
    project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: space.id, goal_id: goal.id, name: "Roadmap Project"})
    milestone = milestone_fixture(%{project_id: project.id, creator_id: person.id, title: "Roadmap Milestone"})
    project_task = task_fixture(%{creator_id: person.id, milestone_id: milestone.id, project_id: project.id, name: "Roadmap Project Task"})
    space_task = task_fixture(%{creator_id: person.id, space_id: space.id, name: "Roadmap Space Task"})

    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)
    {_initialize_conn, session_id} = initialize_session(access_token)

    get_me_body = access_token |> call_tool(session_id, "get_me") |> json_body()
    assert get_me_body["result"]["structuredContent"]["me"]["id"] == OperatelyWeb.Paths.person_id(person)

    list_people_body = access_token |> call_tool(session_id, "list_people") |> json_body()
    assert Enum.sort(Enum.map(list_people_body["result"]["structuredContent"]["people"], & &1["id"])) == Enum.sort([OperatelyWeb.Paths.person_id(person), OperatelyWeb.Paths.person_id(coworker)])

    get_person_body = access_token |> call_tool(session_id, "get_person", %{"person_id" => OperatelyWeb.Paths.person_id(coworker)}) |> json_body()
    assert get_person_body["result"]["structuredContent"]["person"]["id"] == OperatelyWeb.Paths.person_id(coworker)

    list_spaces_body = access_token |> call_tool(session_id, "list_spaces") |> json_body()
    assert OperatelyWeb.Paths.space_id(space) in Enum.map(list_spaces_body["result"]["structuredContent"]["spaces"], & &1["id"])

    get_space_body = access_token |> call_tool(session_id, "get_space", %{"space_id" => OperatelyWeb.Paths.space_id(space)}) |> json_body()
    assert get_space_body["result"]["structuredContent"]["space"]["id"] == OperatelyWeb.Paths.space_id(space)

    list_projects_body = access_token |> call_tool(session_id, "list_projects") |> json_body()
    assert Enum.map(list_projects_body["result"]["structuredContent"]["projects"], & &1["id"]) == [OperatelyWeb.Paths.project_id(project)]

    get_project_body = access_token |> call_tool(session_id, "get_project", %{"project_id" => OperatelyWeb.Paths.project_id(project)}) |> json_body()
    assert get_project_body["result"]["structuredContent"]["project"]["id"] == OperatelyWeb.Paths.project_id(project)

    get_milestone_body = access_token |> call_tool(session_id, "get_milestone", %{"milestone_id" => OperatelyWeb.Paths.milestone_id(milestone)}) |> json_body()
    assert get_milestone_body["result"]["structuredContent"]["milestone"]["id"] == OperatelyWeb.Paths.milestone_id(milestone)

    list_milestone_tasks_body =
      access_token
      |> call_tool(session_id, "list_milestone_tasks", %{"milestone_id" => OperatelyWeb.Paths.milestone_id(milestone)})
      |> json_body()

    assert Enum.map(list_milestone_tasks_body["result"]["structuredContent"]["tasks"], & &1["id"]) == [OperatelyWeb.Paths.task_id(project_task)]

    list_goals_body = access_token |> call_tool(session_id, "list_goals") |> json_body()
    assert Enum.map(list_goals_body["result"]["structuredContent"]["goals"], & &1["id"]) == [OperatelyWeb.Paths.goal_id(goal)]

    list_project_tasks_body =
      access_token
      |> call_tool(session_id, "list_tasks", %{"project_id" => OperatelyWeb.Paths.project_id(project)})
      |> json_body()

    assert Enum.map(list_project_tasks_body["result"]["structuredContent"]["tasks"], & &1["id"]) == [OperatelyWeb.Paths.task_id(project_task)]

    list_space_tasks_body =
      access_token
      |> call_tool(session_id, "list_tasks", %{"space_id" => OperatelyWeb.Paths.space_id(space)})
      |> json_body()

    assert Enum.map(list_space_tasks_body["result"]["structuredContent"]["tasks"], & &1["id"]) == [OperatelyWeb.Paths.task_id(space_task)]

    get_task_body = access_token |> call_tool(session_id, "get_task", %{"task_id" => OperatelyWeb.Paths.task_id(project_task)}) |> json_body()
    assert get_task_body["result"]["structuredContent"]["task"]["id"] == OperatelyWeb.Paths.task_id(project_task)

    search_body = access_token |> call_tool(session_id, "search", %{"query" => "Roadmap"}) |> json_body()
    assert Enum.map(search_body["result"]["structuredContent"]["spaces"], & &1["id"]) == [OperatelyWeb.Paths.space_id(space)]
    assert Enum.map(search_body["result"]["structuredContent"]["projects"], & &1["id"]) == [OperatelyWeb.Paths.project_id(project)]
    assert Enum.map(search_body["result"]["structuredContent"]["goals"], & &1["id"]) == [OperatelyWeb.Paths.goal_id(goal)]
    assert Enum.map(search_body["result"]["structuredContent"]["milestones"], & &1["id"]) == [OperatelyWeb.Paths.milestone_id(milestone)]

    fetch_body =
      access_token
      |> call_tool(session_id, "fetch", %{"url" => OperatelyWeb.Paths.to_url(OperatelyWeb.Paths.project_path(company, project))})
      |> json_body()

    assert fetch_body["result"]["structuredContent"]["url"] == OperatelyWeb.Paths.to_url(OperatelyWeb.Paths.project_path(company, project))
    assert fetch_body["result"]["structuredContent"]["resource"]["type"] == "project"
    assert fetch_body["result"]["structuredContent"]["resource"]["data"]["id"] == OperatelyWeb.Paths.project_id(project)
    assert [%{"type" => "text", "text" => fetch_result_text}] = fetch_body["result"]["structuredContent"]["content"]
    assert is_binary(fetch_result_text)
    assert [%{"type" => "text", "text" => outer_text}] = fetch_body["result"]["content"]
    assert Jason.decode!(outer_text) == fetch_body["result"]["structuredContent"]
  end

  test "executes the live write tools through tools/call", %{account: account, company: company, client: client} do
    person = People.get_person(account, company)
    space = group_fixture(person, %{company_id: company.id, name: "Roadmap Space"})
    project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: space.id, name: "Roadmap Project"})
    goal = goal_fixture(person, %{company_id: company.id, space_id: space.id, name: "Roadmap Goal"})
    resource_hub = default_resource_hub_for_space(space)
    document = document_fixture(resource_hub.id, person.id)

    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client, "mcp:read mcp:write")
    {_initialize_conn, session_id} = initialize_session(access_token)

    create_comment_body =
      access_token
      |> call_tool(session_id, "create_comment", %{
        "resource_id" => OperatelyWeb.Paths.document_id(document),
        "parent_type" => "document",
        "content" => "Comment from MCP"
      })
      |> json_body()

    assert create_comment_body["result"]["structuredContent"]["comment"]["id"]
    assert [%{"type" => "text", "text" => create_comment_text}] = create_comment_body["result"]["content"]
    assert Jason.decode!(create_comment_text) == create_comment_body["result"]["structuredContent"]

    create_project_check_in_body =
      access_token
      |> call_tool(session_id, "create_project_check_in", %{
        "project_id" => OperatelyWeb.Paths.project_id(project),
        "status" => "on_track",
        "content" => "Project update from MCP"
      })
      |> json_body()

    assert create_project_check_in_body["result"]["structuredContent"]["check_in"]["status"] == "on_track"
    assert [%{"type" => "text", "text" => project_check_in_text}] = create_project_check_in_body["result"]["content"]
    assert Jason.decode!(project_check_in_text) == create_project_check_in_body["result"]["structuredContent"]

    create_goal_check_in_body =
      access_token
      |> call_tool(session_id, "create_goal_check_in", %{
        "goal_id" => OperatelyWeb.Paths.goal_id(goal),
        "status" => "caution",
        "content" => "Goal update from MCP"
      })
      |> json_body()

    assert create_goal_check_in_body["result"]["structuredContent"]["check_in"]["status"] == "caution"
    assert [%{"type" => "text", "text" => goal_check_in_text}] = create_goal_check_in_body["result"]["content"]
    assert Jason.decode!(goal_check_in_text) == create_goal_check_in_body["result"]["structuredContent"]
  end

  test "returns invalid params for unknown tool names", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)
    {_initialize_conn, session_id} = initialize_session(access_token)

    conn =
      build_conn()
      |> session_headers(access_token, session_id)
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "4",
        "method" => "tools/call",
        "params" => %{
          "name" => "missing_tool",
          "arguments" => %{}
        }
      })

    body = Jason.decode!(conn.resp_body)

    assert conn.status == 200
    assert body["error"]["code"] == -32602
  end

  test "returns invalid params for malformed tools/call params", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)
    {_initialize_conn, session_id} = initialize_session(access_token)

    conn =
      build_conn()
      |> session_headers(access_token, session_id)
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "4",
        "method" => "tools/call",
        "params" => %{
          "name" => "",
          "arguments" => "not-a-map"
        }
      })

    body = Jason.decode!(conn.resp_body)

    assert conn.status == 200
    assert body["error"]["code"] == -32602
  end

  test "returns invalid params for invalid tool arguments", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)
    {_initialize_conn, session_id} = initialize_session(access_token)

    conn =
      build_conn()
      |> session_headers(access_token, session_id)
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "4",
        "method" => "tools/call",
        "params" => %{
          "name" => "get_current_company",
          "arguments" => %{"unexpected" => true}
        }
      })

    body = Jason.decode!(conn.resp_body)

    assert conn.status == 200
    assert body["error"]["code"] == -32602
  end

  test "returns invalid params for invalid write-tool arguments", %{account: account, company: company, client: client} do
    person = People.get_person(account, company)
    project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: company.company_space_id})

    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client, "mcp:read mcp:write")
    {_initialize_conn, session_id} = initialize_session(access_token)

    invalid_status_body =
      access_token
      |> call_tool(session_id, "create_project_check_in", %{
        "project_id" => OperatelyWeb.Paths.project_id(project),
        "status" => "blocked",
        "content" => "Update"
      })
      |> json_body()

    blank_content_body =
      access_token
      |> call_tool(session_id, "create_comment", %{
        "resource_id" => OperatelyWeb.Paths.project_id(project),
        "parent_type" => "project_discussion",
        "content" => "   "
      })
      |> json_body()

    assert invalid_status_body["error"]["code"] == -32602
    assert blank_content_body["error"]["code"] == -32602
  end

  test "returns invalid params when list_tasks receives none or both identifiers", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)
    {_initialize_conn, session_id} = initialize_session(access_token)

    none_body =
      access_token
      |> call_tool(session_id, "list_tasks")
      |> json_body()

    both_body =
      access_token
      |> call_tool(session_id, "list_tasks", %{"project_id" => "project_123", "space_id" => "space_123"})
      |> json_body()

    assert none_body["error"]["code"] == -32602
    assert both_body["error"]["code"] == -32602
  end

  test "returns invalid params for malformed goal identifiers", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)
    {_initialize_conn, session_id} = initialize_session(access_token)

    conn =
      build_conn()
      |> session_headers(access_token, session_id)
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "4",
        "method" => "tools/call",
        "params" => %{
          "name" => "get_goal",
          "arguments" => %{"goal_id" => "definitely-not-a-valid-operately-id-%%%"}
        }
      })

    body = Jason.decode!(conn.resp_body)

    assert conn.status == 200
    assert body["error"]["code"] == -32602
  end

  test "returns a tool-level error for cross-company get_goal access", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)
    {_initialize_conn, session_id} = initialize_session(access_token)

    other_account = account_fixture()
    other_company = company_fixture(%{company_name: "Other Company"}, other_account)
    other_person = People.get_person(other_account, other_company)
    other_space = group_fixture(other_person, company_id: other_company.id)
    other_goal = goal_fixture(other_person, %{company_id: other_company.id, space_id: other_space.id})

    conn =
      build_conn()
      |> session_headers(access_token, session_id)
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "4",
        "method" => "tools/call",
        "params" => %{
          "name" => "get_goal",
          "arguments" => %{"goal_id" => OperatelyWeb.Paths.goal_id(other_goal)}
        }
      })

    body = Jason.decode!(conn.resp_body)

    assert conn.status == 200
    assert body["result"]["isError"] == true

    assert body["result"]["content"] == [
             %{"type" => "text", "text" => "The requested resource was not found or is not accessible."}
           ]

    refute Map.has_key?(body["result"], "structuredContent")
  end

  test "returns tool-level errors for cross-company get_project, get_task, and fetch access", %{account: account, company: company, client: client} do
    person = People.get_person(account, company)
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)
    {_initialize_conn, session_id} = initialize_session(access_token)

    other_account = account_fixture()
    other_company = company_fixture(%{company_name: "Other Company"}, other_account)
    other_person = People.get_person(other_account, other_company)
    other_space = group_fixture(other_person, company_id: other_company.id)
    other_project = project_fixture(%{company_id: other_company.id, creator_id: other_person.id, group_id: other_space.id, name: "Other Project"})
    other_milestone = milestone_fixture(%{project_id: other_project.id, creator_id: other_person.id})
    other_task = task_fixture(%{creator_id: other_person.id, milestone_id: other_milestone.id, project_id: other_project.id, name: "Other Task"})

    _current_project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: company.company_space_id, name: "Current Project"})

    get_project_body =
      access_token
      |> call_tool(session_id, "get_project", %{"project_id" => OperatelyWeb.Paths.project_id(other_project)})
      |> json_body()

    get_task_body =
      access_token
      |> call_tool(session_id, "get_task", %{"task_id" => OperatelyWeb.Paths.task_id(other_task)})
      |> json_body()

    fetch_body =
      access_token
      |> call_tool(session_id, "fetch", %{"url" => OperatelyWeb.Paths.to_url(OperatelyWeb.Paths.project_path(other_company, other_project))})
      |> json_body()

    assert get_project_body["result"]["isError"] == true
    assert get_task_body["result"]["isError"] == true
    assert fetch_body["result"]["isError"] == true
  end

  test "binds tools to the selected company during multi-company authorization", %{client: client} do
    account = account_fixture()
    company_a = company_fixture(%{company_name: "Alpha Company"}, account)
    company_b = company_fixture(%{company_name: "Beta Company"}, account)
    person_a = People.get_person(account, company_a)
    person_b = People.get_person(account, company_b)

    project_a = project_fixture(%{company_id: company_a.id, creator_id: person_a.id, group_id: company_a.company_space_id, name: "Alpha Project"})
    project_b = project_fixture(%{company_id: company_b.id, creator_id: person_b.id, group_id: company_b.company_space_id, name: "Beta Project"})

    %{access_token: access_token} =
      authorize_and_issue_tokens(account, company_a, client, "mcp:read", selected_company_id: company_b.id)

    {_initialize_conn, session_id} = initialize_session(access_token)

    body = access_token |> call_tool(session_id, "list_projects") |> json_body()

    assert Enum.map(body["result"]["structuredContent"]["projects"], & &1["id"]) == [OperatelyWeb.Paths.project_id(project_b)]
    refute Enum.any?(body["result"]["structuredContent"]["projects"], &(&1["id"] == OperatelyWeb.Paths.project_id(project_a)))
  end

  test "search does not leak resources from another company", %{account: account, company: company, client: client} do
    person = People.get_person(account, company)
    current_project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: company.company_space_id, name: "Roadmap Atlas"})

    other_account = account_fixture()
    other_company = company_fixture(%{company_name: "Other Company"}, other_account)
    other_person = People.get_person(other_account, other_company)
    other_project = project_fixture(%{company_id: other_company.id, creator_id: other_person.id, group_id: other_company.company_space_id, name: "Roadmap Atlas"})

    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)
    {_initialize_conn, session_id} = initialize_session(access_token)

    body = access_token |> call_tool(session_id, "search", %{"query" => "Roadmap"}) |> json_body()
    project_ids = Enum.map(body["result"]["structuredContent"]["projects"], & &1["id"])

    assert OperatelyWeb.Paths.project_id(current_project) in project_ids
    refute OperatelyWeb.Paths.project_id(other_project) in project_ids
  end

  test "requires session and protocol version for tools/call", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)
    {_initialize_conn, session_id} = initialize_session(access_token)

    missing_session_conn =
      build_conn()
      |> authenticated_mcp_headers(access_token)
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "4",
        "method" => "tools/call",
        "params" => %{
          "name" => "get_current_company"
        }
      })

    missing_protocol_conn =
      build_conn()
      |> authenticated_mcp_headers(access_token)
      |> put_req_header("mcp-session-id", session_id)
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "5",
        "method" => "tools/call",
        "params" => %{
          "name" => "get_current_company"
        }
      })

    assert missing_session_conn.status == 400
    assert missing_protocol_conn.status == 400
  end

  test "returns insufficient_scope for write tools when the token only has mcp:read", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client, "mcp:read")
    {_initialize_conn, session_id} = initialize_session(access_token)

    Enum.each(write_tool_names(), fn tool_name ->
      conn =
        access_token
        |> call_tool(session_id, tool_name, %{})

      assert conn.status == 403
      assert get_resp_header(conn, "www-authenticate") |> List.first() =~ ~s(error="insufficient_scope")
      assert get_resp_header(conn, "www-authenticate") |> List.first() =~ ~s(scope="mcp:write")
    end)
  end

  test "returns tool-level errors for write-tool business rejections", %{account: account, company: company, client: client} do
    person = People.get_person(account, company)
    current_project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: company.company_space_id, name: "Current Project"})

    other_account = account_fixture()
    other_company = company_fixture(%{company_name: "Other Company"}, other_account)
    other_person = People.get_person(other_account, other_company)
    other_space = group_fixture(other_person, company_id: other_company.id)
    other_goal = goal_fixture(other_person, %{company_id: other_company.id, space_id: other_space.id})
    other_update = goal_update_fixture(other_person, other_goal)

    {:ok, billing_account} = Billing.get_or_create_billing_account(company)

    {:ok, _billing_account} =
      Billing.update_billing_account(billing_account, %{
        access_state: :read_only,
        access_state_reason: :past_due,
        access_state_started_at: DateTime.utc_now(),
        access_state_ends_at: nil
      })

    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client, "mcp:read mcp:write")
    {_initialize_conn, session_id} = initialize_session(access_token)

    cross_company_comment_body =
      access_token
      |> call_tool(session_id, "create_comment", %{
        "resource_id" => OperatelyWeb.Paths.goal_update_id(other_update),
        "parent_type" => "goal_check_in",
        "content" => "Comment from MCP"
      })
      |> json_body()

    read_only_company_body =
      access_token
      |> call_tool(session_id, "create_project_check_in", %{
        "project_id" => OperatelyWeb.Paths.project_id(current_project),
        "status" => "on_track",
        "content" => "Project update from MCP"
      })
      |> json_body()

    assert cross_company_comment_body["result"]["isError"] == true

    assert cross_company_comment_body["result"]["content"] == [
             %{"type" => "text", "text" => "The requested resource was not found or is not accessible."}
           ]

    assert read_only_company_body["result"]["isError"] == true

    assert read_only_company_body["result"]["content"] == [
             %{
               "type" => "text",
               "text" => "You do not have permission to perform this operation, or the company is read-only."
             }
           ]
  end

  test "uses tool-definition scopes for tools/call", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client, "mcp:write")
    session_id = create_session(access_token).id

    conn =
      build_conn()
      |> session_headers(access_token, session_id)
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "4",
        "method" => "tools/call",
        "params" => %{
          "name" => "get_current_company"
        }
      })

    assert conn.status == 403
    assert get_resp_header(conn, "www-authenticate") |> List.first() =~ ~s(error="insufficient_scope")
    assert get_resp_header(conn, "www-authenticate") |> List.first() =~ ~s(scope="mcp:read")
  end

  defp initialize_request do
    %{
      "jsonrpc" => "2.0",
      "id" => "1",
      "method" => "initialize",
      "params" => %{
        "protocolVersion" => Mcp.latest_protocol_version(),
        "capabilities" => %{},
        "clientInfo" => %{
          "name" => "Example Client",
          "version" => "1.0.0"
        }
      }
    }
  end

  defp initialize_session(access_token) do
    conn =
      build_conn()
      |> authenticated_mcp_headers(access_token)
      |> post("/mcp", initialize_request())

    {conn, conn |> get_resp_header("mcp-session-id") |> List.first()}
  end

  defp authenticated_mcp_headers(conn, access_token) do
    conn
    |> put_req_header("accept", "application/json, text/event-stream")
    |> put_req_header("content-type", "application/json")
    |> put_req_header("authorization", "Bearer #{access_token}")
  end

  defp session_headers(conn, access_token, session_id) do
    conn
    |> authenticated_mcp_headers(access_token)
    |> put_req_header("mcp-session-id", session_id)
    |> put_req_header("mcp-protocol-version", Mcp.latest_protocol_version())
  end

  defp authorize_and_issue_tokens(account, company, client, scope \\ "mcp:read", opts \\ []) do
    conn = build_conn() |> log_in_account(account, company)

    params = %{
      "client_id" => client.client_id,
      "redirect_uri" => hd(client.redirect_uris),
      "resource" => Mcp.canonical_resource_uri(),
      "scope" => scope,
      "state" => "mcp-state",
      "code_challenge" => pkce_challenge(),
      "code_challenge_method" => "S256"
    }

    consent_conn = get(conn, "/oauth/authorize", params)
    csrf_token = csrf_token(consent_conn)

    redirect_conn =
      consent_conn
      |> recycle()
      |> post(
        "/oauth/authorize",
        params
        |> Map.merge(%{"decision" => "approve", "_csrf_token" => csrf_token})
        |> maybe_put_selected_company_id(opts)
      )

    code =
      redirect_conn
      |> redirected_to()
      |> URI.parse()
      |> Map.fetch!(:query)
      |> URI.decode_query()
      |> Map.fetch!("code")

    token_conn =
      post(build_conn(), "/oauth/token", %{
        "grant_type" => "authorization_code",
        "client_id" => client.client_id,
        "redirect_uri" => hd(client.redirect_uris),
        "resource" => Mcp.canonical_resource_uri(),
        "code" => code,
        "code_verifier" => "test-verifier"
      })

    Jason.decode!(token_conn.resp_body, keys: :atoms)
  end

  defp create_session(raw_access_token) do
    {:ok, %{access_token: access_token, grant: grant}} = Mcp.authenticate_access_token(raw_access_token, Mcp.canonical_resource_uri())

    {:ok, session} =
      Mcp.create_session(grant, access_token, %{
        protocol_version: Mcp.latest_protocol_version(),
        client_info: %{"name" => "Example Client", "version" => "1.0.0"},
        client_capabilities: %{}
      })

    session
  end

  defp csrf_token(conn) do
    {:ok, document} = Floki.parse_document(conn.resp_body)

    document
    |> Floki.find("input[name=\"_csrf_token\"]")
    |> Floki.attribute("value")
    |> List.first()
  end

  defp pkce_challenge do
    :crypto.hash(:sha256, "test-verifier")
    |> Base.url_encode64(padding: false)
  end

  defp call_tool(access_token, session_id, name, arguments \\ %{}) do
    build_conn()
    |> session_headers(access_token, session_id)
    |> post("/mcp", %{
      "jsonrpc" => "2.0",
      "id" => "4",
      "method" => "tools/call",
      "params" => %{
        "name" => name,
        "arguments" => arguments
      }
    })
  end

  defp json_body(conn), do: Jason.decode!(conn.resp_body)

  defp maybe_put_selected_company_id(params, opts) do
    case Keyword.get(opts, :selected_company_id) do
      nil -> params
      company_id -> Map.put(params, "selected_company_id", company_id)
    end
  end

  defp expected_tool_names do
    McpTools.list_definitions()
    |> Enum.map(& &1.name)
  end

  defp write_tool_names do
    McpTools.list_definitions()
    |> Enum.filter(&(&1.required_scopes == ["mcp:write"]))
    |> Enum.map(& &1.name)
  end
end
