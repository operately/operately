defmodule TurboConnect.TsGenTest do
  use ExUnit.Case

  defmodule ExampleTypes do
    use TurboConnect.Types

    primitive(:id, encoded_type: :integer, decode_with: &String.to_integer/1)

    object :user do
      field :full_name, :string, null: false
      field :address, :address

      field? :posts, list_of(:post)
    end

    object :address do
      field? :street, :string
      field? :city, :string
    end

    enum(:post_status, values: [:draft, :published])

    object :post do
      field? :title, :string
      field? :content, :string
      field? :status, :post_status
    end

    object :event do
      field? :inserted_at, :datetime
      field? :content, :event_content
    end

    union(:event_content, types: [:user_added_event, :user_removed_event])

    object :user_added_event do
      field? :user_id, :integer
    end

    object :user_removed_event do
      field? :user_id, :integer
    end
  end

  defmodule GetUserQuery do
    use TurboConnect.Query

    inputs do
      field? :user_id, :integer
    end

    outputs do
      field? :user, :user
    end

    def call(%{user_id: _user_id}) do
      user = %{
        full_name: "John Doe",
        address: %{
          street: "123 Main St",
          city: "Springfield"
        },
        posts: [
          %{
            title: "Post 1",
            content: "Content 1"
          },
          %{
            title: "Post 2",
            content: "Content 2"
          }
        ]
      }

      {:ok, %{user: user}}
    end
  end

  defmodule CreateUserMutation do
    use TurboConnect.Mutation

    inputs do
      field? :full_name, :string
      field? :address, :address
    end

    outputs do
      field? :user, :user
    end

    def call(_conn, _inputs) do
      {:ok, nil}
    end
  end

  defmodule ExampleApi do
    use TurboConnect.Api

    use_types(ExampleTypes)

    query(:get_user, GetUserQuery)
    mutation(:create_user, CreateUserMutation)

    namespace(:users) do
      query(:get_user, GetUserQuery)
      mutation(:create_user, CreateUserMutation)
    end
  end

  @ts_imports """
  import React from "react";
  import axios from "axios";
  """

  @ts_types """
  export type Id = number;

  export interface Address {
    street?: string;
    city?: string;
  }

  export interface Event {
    insertedAt?: string;
    content?: EventContent;
  }

  export interface Post {
    title?: string;
    content?: string;
    status?: PostStatus;
  }

  export interface User {
    fullName: string;
    address: Address;
    posts?: Post[];
  }

  export interface UserAddedEvent {
    userId?: number;
  }

  export interface UserRemovedEvent {
    userId?: number;
  }

  export type EventContent = UserAddedEvent | UserRemovedEvent;

  export type PostStatus = "draft" | "published";

  export interface GetUserInput {
    userId?: number;
  }

  export interface GetUserResult {
    user?: User;
  }


  export interface UsersGetUserInput {
    userId?: number;
  }

  export interface UsersGetUserResult {
    user?: User;
  }

  export interface CreateUserInput {
    fullName?: string;
    address?: Address;
  }

  export interface CreateUserResult {
    user?: User;
  }


  export interface UsersCreateUserInput {
    fullName?: string;
    address?: Address;
  }

  export interface UsersCreateUserResult {
    user?: User;
  }
  """

  @ts_api_client """
  export class ApiClient {
    private basePath: string;
    private headers: any;
    public apiNamespaceUsers: ApiNamespaceUsers;
    public apiNamespaceRoot: ApiNamespaceRoot;

    constructor() {
      this.apiNamespaceUsers = new ApiNamespaceUsers(this);
      this.apiNamespaceRoot = new ApiNamespaceRoot(this);
    }

    setBasePath(basePath: string) {
      this.basePath = basePath;
    }

    getBasePath() {
      if (!this.basePath) throw new Error("ApiClient is not configured");
      return this.basePath;
    }

    setHeaders(headers: any) {
      this.headers = headers;
    }

    getHeaders() {
      return this.headers || {};
    }

    // @ts-ignore
    async post(path: string, data: any) {
      const response = await axios.post(this.getBasePath() + path, toSnake(data), { headers: this.getHeaders() });
      return toCamel(response.data);
    }

    // @ts-ignore
    async get(path: string, params: any) {
      const response = await axios.get(this.getBasePath() + path, { params: toSnake(params), headers: this.getHeaders() });
      return toCamel(response.data);
    }

    getUser(input: GetUserInput): Promise<GetUserResult> {
      return this.apiNamespaceRoot.getUser(input);
    }

    createUser(input: CreateUserInput): Promise<CreateUserResult> {
      return this.apiNamespaceRoot.createUser(input);
    }


  }
  """

  @ts_namespaces """
  class ApiNamespaceUsers {
    constructor(private client: ApiClient) {}

    async getUser(input: UsersGetUserInput): Promise<UsersGetUserResult> {
      return this.client.get("/users/get_user", input);
    }

    async createUser(input: UsersCreateUserInput): Promise<UsersCreateUserResult> {
      return this.client.post("/users/create_user", input);
    }

  };

  class ApiNamespaceRoot {
    constructor(private client: ApiClient) {}

    async getUser(input: GetUserInput): Promise<GetUserResult> {
      return this.client.get("/get_user", input);
    }

    async createUser(input: CreateUserInput): Promise<CreateUserResult> {
      return this.client.post("/create_user", input);
    }

  };
  """

  @ts_default """
  const defaultApiClient = new ApiClient();

  export async function getUser(input: GetUserInput) : Promise<GetUserResult> {
    return defaultApiClient.getUser(input);
  }
  export async function createUser(input: CreateUserInput) : Promise<CreateUserResult> {
    return defaultApiClient.createUser(input);
  }

  export function useGetUser(input: GetUserInput) : UseQueryHookResult<GetUserResult> {
    return useQuery<GetUserResult>(() => defaultApiClient.getUser(input));
  }

  export function useCreateUser() : UseMutationHookResult<CreateUserInput, CreateUserResult> {
    return useMutation<CreateUserInput, CreateUserResult>((input) => defaultApiClient.createUser(input));
  }

  export default {
    default: defaultApiClient,

    getUser,
    useGetUser,
    createUser,
    useCreateUser,

    users: {
      getUser: (input: UsersGetUserInput) => defaultApiClient.apiNamespaceUsers.getUser(input),
      useGetUser: (input: UsersGetUserInput) => useQuery<UsersGetUserResult>(() => defaultApiClient.apiNamespaceUsers.getUser(input)),

      createUser: (input: UsersCreateUserInput) => defaultApiClient.apiNamespaceUsers.createUser(input),
      useCreateUser: () => useMutation<UsersCreateUserInput, UsersCreateUserResult>((input) => defaultApiClient.apiNamespaceUsers.createUser(input)),

    },

  };
  """

  test "generating TypeScript imports" do
    assert_same(TurboConnect.TsGen.generate_imports(), @ts_imports)
  end

  test "generating TypeScript types" do
    assert_same(TurboConnect.TsGen.generate_types(ExampleApi), @ts_types)
  end

  test "generating TypeScript namespaces" do
    assert_same(TurboConnect.TsGen.generate_namespaces(ExampleApi), @ts_namespaces)
  end

  test "generating TypeScript api client class" do
    assert_same(TurboConnect.TsGen.generate_api_client_class(ExampleApi), @ts_api_client)
  end

  test "generating TypeScript default exports" do
    assert_same(TurboConnect.TsGen.generate_default_exports(ExampleApi), @ts_default)
  end

  test "generating everything together" do
    assert_same(
      TurboConnect.TsGen.generate(ExampleApi),
      """
      #{@ts_imports}
      #{TurboConnect.TsGen.to_camel_case()}
      #{TurboConnect.TsGen.to_snake_case()}
      #{TurboConnect.TsGen.Queries.define_generic_use_query_hook()}
      #{TurboConnect.TsGen.Mutations.define_generic_use_mutation_hook()}
      #{@ts_types}
      #{@ts_namespaces}
      #{@ts_api_client}
      #{@ts_default}
      """
    )
  end

  defp assert_same(result, expected) do
    if result == expected do
      :ok
    else
      show_side_by_side(result, expected)
      raise "Generated code does not match expected code"
    end
  end

  defp show_side_by_side(result, expected) do
    IO.puts("\n\n")

    result = "Result:\n\n" <> result
    expected = "Expected:\n\n" <> expected

    result_lines = String.split(result, "\n")
    expected_lines = String.split(expected, "\n")

    max_length = max(length(result_lines), length(expected_lines))
    max_line_length = Enum.map(result_lines, &String.length/1) |> Enum.reduce(0, &max/2)

    for i <- 0..(max_length - 1) do
      result_line = Enum.at(result_lines, i, "")
      expected_line = Enum.at(expected_lines, i, "")

      if result_line == expected_line do
        IO.puts("#{String.pad_trailing(result_line, max_line_length)} | #{expected_line}")
      else
        IO.puts("\e[31m#{String.pad_trailing(result_line, max_line_length)}\e[0m | \e[32m#{expected_line}\e[0m")
      end
    end
  end
end
