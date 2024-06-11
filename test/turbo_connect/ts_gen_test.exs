defmodule TurboConnect.TsGenTest do
  use ExUnit.Case

  defmodule ExampleTypes do
    use TurboConnect.Types

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

    def call(%{user_id: user_id}) do
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
  export interface Address {
    street: string;
    city: string;
  }

  export interface Event {
    insertedAt: Date;
    content: EventContent;
  }

  export interface Post {
    title: string;
    content: string;
  }

  export interface User {
    fullName: string;
    address: Address;
    posts: Post[];
  }

  export interface UserAddedEvent {
    userId: number;
  }

  export interface UserRemovedEvent {
    userId: number;
  }

  export type EventContent = UserAddedEvent | UserRemovedEvent;

  export interface GetUserInput {
    userId: number;
  }

  export interface GetUserResult {
    user: User;
  }

  export interface CreateUserInput {
    fullName: string;
    address: Address;
  }

  export interface CreateUserResult {
    user: User;
  }
  """

  @ts_api_client """
  interface ApiClientConfig {
    basePath: string;
  }

  export class ApiClient {
    private basePath: string;

    configure(config: ApiClientConfig) {
      this.basePath = config.basePath;
    }

    async getUser(input: GetUserInput): Promise<GetUserResult> {
      return axios.get(this.basePath + "/get_user", { params: input }).then(({ data }) => data);
    }

    async createUser(input: CreateUserInput): Promise<CreateUserResult> {
      return axios.post(this.basePath + "/create_user", input).then(({ data }) => data);
    }

  }
  """

  @ts_hooks """
  export function useGetUser(input: GetUserInput) : UseQueryHookResult<GetUserResult> {
    return useQuery<GetUserResult>(() => defaultApiClient.getUser(input));
  }

  export function useCreateUser() : UseMutationHookResult<CreateUserInput, CreateUserResult> {
    return useMutation<CreateUserInput, CreateUserResult>((input) => defaultApiClient.createUser(input));
  }

  """

  @ts_default """
  const defaultApiClient = new ApiClient();

  export default {
    configureDefault: (config) => defaultApiClient.configure(config),

    getUser: (input: GetUserInput) => defaultApiClient.getUser(input),
    useGetUser,
    createUser: (input: CreateUserInput) => defaultApiClient.createUser(input),
    useCreateUser,
  };
  """

  test "generating TypeScript code" do
    assert TurboConnect.TsGen.generate_imports() === @ts_imports
    assert TurboConnect.TsGen.generate_types(ExampleApi) === @ts_types
    assert TurboConnect.TsGen.generate_api_client_class(ExampleApi) === @ts_api_client
    assert TurboConnect.TsGen.generate_hooks(ExampleApi) === @ts_hooks
    assert TurboConnect.TsGen.generate_default_exports(ExampleApi) === @ts_default

    assert TurboConnect.TsGen.generate(ExampleApi) === """
    #{@ts_imports}
    #{TurboConnect.TsGen.Queries.define_generic_use_query_hook()}
    #{TurboConnect.TsGen.Mutations.define_generic_use_mutation_hook()}
    #{@ts_types}
    #{@ts_api_client}
    #{@ts_hooks}
    #{@ts_default}
    """
  end

end
