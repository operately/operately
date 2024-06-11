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

  @ts_code """
  import React from "react";
  import axios from "axios";

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

  type UseQueryHookResult<ResultT> = { data: ResultT | null, loading: boolean, error: Error | null };

  export function useQuery<ResultT>(fn: () => Promise<ResultT>) : UseQueryHookResult<ResultT> {
    const [data, setData] = React.useState<ResultT | null>(null);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<Error | null>(null);

    React.useEffect(() => {
      setLoading(true);
      setError(null);

      fn().then(setData).catch(setError).finally(() => setLoading(false));
    }, [fn]);

    return { data, loading, error };
  }

  type UseMutationHookResult<InputT, ResultT> = [() => Promise<ResultT>, { data: ResultT | null, loading: boolean, error: Error | null }];

  export function useMutation<InputT, ResultT>(fn: (input: InputT) => Promise<ResultT>) : UseMutationHookResult<InputT, ResultT> {
    const [data, setData] = React.useState<ResultT | null>(null);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<Error | null>(null);

    const execute = (input: InputT) => {
      setLoading(true);
      setError(null);

      fn(input).then(setData).catch(setError).finally(() => setLoading(false));
    };

    return [execute, { data, loading, error }];
  }

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

  export class ApiClient {
    basePath: string = "";

    configure(config: { baseUrl: string }) {
      this.basePath = config.baseUrl;
    }

    async getUser(input: GetUserInput): Promise<GetUserResult> {
      return axios.get('/api/get_user', { params: input }).then(({ data }) => data);
    }

    async createUser(input: CreateUserInput): Promise<CreateUserResult> {
      return axios.post('/api/create_user', input).then(({ data }) => data);
    }
  }

  export function useGetUser(input: GetUserInput) : UseQueryHookResult<GetUserResult> {
    return useQuery<GetUserResult>(() => defaultApiClient.getUser(input));
  }

  export function useCreateUser() : UseMutationHookResult<CreateUserInput, CreateUserResult> {
    return useMutation<CreateUserInput, CreateUserResult>((input) => defaultApiClient.createUser(input));
  }

  const defaultApiClient = new ApiClient();

  export default {
    configureDefault: (config) => defaultApiClient.configure(config);

    useGetUser,
    useCreateUser

    getUser: (input: GetUserInput) => defaultApiClient.getUser(input),
    createUser: (input: CreateUserInput) => defaultApiClient.createUser(input)
  };
  """

  test "generating TypeScript code" do
    assert TurboConnect.TsGen.generate(ExampleApi) === @ts_code
  end

end
