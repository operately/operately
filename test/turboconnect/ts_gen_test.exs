defmodule TurboConnect.TsGenTest do
  use ExUnit.Case

  defmodule TestSpec do
    use TurboConnect.Specs

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
  end

  @ts_code """
  export interface Address {
    street: string;
    city: string;
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
  """

  test "generating TypeScript code" do
    spec = TestSpec.get_specs()

    assert TurboConnect.TsGen.generate(spec) === @ts_code
  end

end
