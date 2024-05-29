defmodule TurboConnect.SpecsTest do
  use ExUnit.Case

  defmodule TestSpec do
    use TurboConnect.Specs

    object :user do
      field :name, :string
      field :age, :integer
    end

    object :post do
      field :title, :string
      field :content, :string
    end
  end

  test "definining objects and their fields" do
    assert TestSpec.get_specs() == %{
      objects: %{
        user: %{
          fields: [
            %{
              name: :name, 
              type: :string, 
              opts: []
            },
            %{
              name: :age, 
              type: :integer, 
              opts: []
            }
          ]
        },
        post: %{
          fields: [
            %{
              name: :title, 
              type: :string, 
              opts: []
            },
            %{
              name: :content, 
              type: :string, 
              opts: []
            }
          ]
        }
      }
    }
  end

  defmodule TestSpec2 do
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

  test "referencing other objects" do
    assert TestSpec2.get_specs() == %{
      objects: %{
        user: %{
          fields: [
            %{
              name: :name, 
              type: :string, 
              opts: []
            },
            %{
              name: :address,
              type: :address,
              opts: []
            }
          ]
        },
        address: %{
          fields: [
            %{
              name: :street, 
              type: :string, 
              opts: []
            },
            %{
              name: :city, 
              type: :string, 
              opts: []
            }
          ]
        }
      }
    }
  end

  defmodule TestSpec3 do
    use TurboConnect.Specs

    object :user do
      field :name, :string
      field :address, :address
    end
  end

  test "referencing undefined object" do
    expected_message = "In object :user, the :address field has an unknown type :address"

    assert_raise TurboConnect.Specs.UnknownFieldType, expected_message, fn -> TestSpec3.validate_specs() end
  end

end
