defmodule TurboConnect.TypesTest do
  use ExUnit.Case

  defmodule TestSpec do
    use TurboConnect.Types

    object :user do
      field :name, :string
      field :age, :integer
      field :posts, list_of(:post)
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

  test "definining objects and their fields" do
    assert TestSpec.__unions__() == %{
      event_content: [:user_added_event, :user_removed_event]
    }

    assert TestSpec.__objects__() == %{
      user: %{
        fields: [
          {:name, :string, []},
          {:age, :integer, []},
          {:posts, {:list, :post}, []}
        ]
      },
      post: %{
        fields: [
          {:title, :string, []},
          {:content, :string, []}
        ]
      },
      event: %{
        fields: [
          {:inserted_at, :datetime, []},
          {:content, :event_content, []}
        ]
      },
      user_added_event: %{
        fields: [
          {:user_id, :integer, []}
        ]
      },
      user_removed_event: %{
        fields: [
          {:user_id, :integer, []}
        ]
      }
    }
  end

  # defmodule TestSpec2 do
  #   use TurboConnect.Types

  #   object :user do
  #     field :name, :string
  #     field :address, :address
  #   end

  #   object :address do
  #     field :street, :string
  #     field :city, :string
  #   end
  # end

  # test "referencing other objects" do
  #   assert TestSpec2.get_specs() == %{
  #     unions: %{},
  #     objects: %{
  #       user: %{
  #         fields: [
  #           %{
  #             name: :name, 
  #             type: :string, 
  #             opts: []
  #           },
  #           %{
  #             name: :address,
  #             type: :address,
  #             opts: []
  #           }
  #         ]
  #       },
  #       address: %{
  #         fields: [
  #           %{
  #             name: :street, 
  #             type: :string, 
  #             opts: []
  #           },
  #           %{
  #             name: :city, 
  #             type: :string, 
  #             opts: []
  #           }
  #         ]
  #       }
  #     }
  #   }
  # end

  # defmodule TestSpec3 do
  #   use TurboConnect.Types

  #   object :user do
  #     field :name, :string
  #     field :address, :address
  #   end
  # end

  # test "referencing undefined object" do
  #   expected_message = "In object :user, the :address field has an unknown type :address"

  #   assert_raise TurboConnect.Types.UnknownFieldType, expected_message, fn -> TestSpec3.validate_specs() end
  # end

end
