defmodule TurboConnect.TsGenTest do
  use ExUnit.Case

  defmodule ExampleTypes do
    use TurboConnect.Types
    
    primitive :id, encoded_type: :integer, decode_with: &String.to_integer/1

    object :user do
      field :full_name, :string
      field :address, :address
      field :posts, list_of(:post)
    end

    object :address do
      field :street, :string
      field :city, :string
    end

    object :post do
      field :title, :string
      field :content, :string
    end

    object :event do
      field :inserted_at, :datetime
      field :content, :event_content
    end

    union :event_content, types: [:user_added_event, :user_removed_event]

    object :user_added_event do
      field :user_id, :integer
    end
  
    object :user_removed_event do
      field :user_id, :integer
    end
  end

  defmodule GetUserQuery do
    use TurboConnect.Query

    inputs do
      field :user_id, :integer
    end

    outputs do
      field :user, :user
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
      field :full_name, :string
      field :address, :address
    end

    outputs do
      field :user, :user
    end

    def call(_conn, _inputs) do
      {:ok, nil}
    end
  end

  defmodule ExampleApi do
    use TurboConnect.Api

    use_types ExampleTypes

    query :get_user, GetUserQuery
    mutation :create_user, CreateUserMutation
  end

  @ts_imports """
  import React from "react";
  import axios from "axios";
  """

  @ts_types """
  export type Id = number;

  export interface Address {
    street?: string | null;
    city?: string | null;
  }

  export interface Event {
    insertedAt?: string | null;
    content?: EventContent | null;
  }

  export interface Post {
    title?: string | null;
    content?: string | null;
  }

  export interface User {
    fullName?: string | null;
    address?: Address | null;
    posts?: Post[] | null;
  }

  export interface UserAddedEvent {
    userId?: number | null;
  }

  export interface UserRemovedEvent {
    userId?: number | null;
  }

  export type EventContent = UserAddedEvent | UserRemovedEvent;

  export interface GetUserInput {
    userId?: number | null;
  }

  export interface GetUserResult {
    user?: User | null;
  }

  export interface CreateUserInput {
    fullName?: string | null;
    address?: Address | null;
  }

  export interface CreateUserResult {
    user?: User | null;
  }
  """

  @ts_api_client """
  export class ApiClient {
    private basePath: string;
    private headers: any;

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
    private async post(path: string, data: any) {
      const response = await axios.post(this.getBasePath() + path, toSnake(data), { headers: this.getHeaders() });
      return toCamel(response.data);
    } 

    // @ts-ignore
    private async get(path: string, params: any) {
      const response = await axios.get(this.getBasePath() + path, { params: toSnake(params), headers: this.getHeaders() });
      return toCamel(response.data);
    }

    async getUser(input: GetUserInput): Promise<GetUserResult> {
      return this.get("/get_user", input);
    }

    async createUser(input: CreateUserInput): Promise<CreateUserResult> {
      return this.post("/create_user", input);
    }

  }
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
  };
  """

  test "generating TypeScript code" do
    assert TurboConnect.TsGen.generate_imports() === @ts_imports
    assert TurboConnect.TsGen.generate_types(ExampleApi) === @ts_types
    assert TurboConnect.TsGen.generate_api_client_class(ExampleApi) === @ts_api_client
    assert TurboConnect.TsGen.generate_default_exports(ExampleApi) === @ts_default

    assert TurboConnect.TsGen.generate(ExampleApi) === """
    #{@ts_imports}
    #{TurboConnect.TsGen.to_camel_case()}
    #{TurboConnect.TsGen.to_snake_case()}
    #{TurboConnect.TsGen.Queries.define_generic_use_query_hook()}
    #{TurboConnect.TsGen.Mutations.define_generic_use_mutation_hook()}
    #{@ts_types}
    #{@ts_api_client}
    #{@ts_default}
    """
  end

end
