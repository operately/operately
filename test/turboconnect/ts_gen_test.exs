defmodule TurboConnect.TsGenTest do
  use ExUnit.Case

  defmodule TestSpec do
    use TurboConnect.Specs

    object :user do
      field :name, :string
      field :address, :address
    end

    object :address do
      field :street, :string
      field :city, :string
    end
  end

  @ts_code """
    export interface User {
      name: string;
      address: Address;
    }

    export interface Address {
      street: string;
      city: string;
    }
  """

  test "generating TypeScript code" do
    spec = TestSpec.get_specs()

    assert TurboConnect.TsGen.generate(spec) === @ts_code
  end

end
