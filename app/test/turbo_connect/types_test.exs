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

end
