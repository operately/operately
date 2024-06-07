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

  defmodule ExampleApi do
    use TurboConnect.Api

    use_types ExampleTypes
  end

  @ts_code """
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
  """

  test "generating TypeScript code" do
    assert TurboConnect.TsGen.generate(ExampleApi) === @ts_code
  end

end
