defmodule TurboConnect.TypesTest do
  use ExUnit.Case

  defmodule TestSpec do
    use TurboConnect.Types

    object :user do
      field? :name, :string
      field? :age, :integer
      field? :posts, list_of(:post)
    end

    object :post do
      field? :title, :string
      field? :content, :string, null: true
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

  test "definining objects and their fields" do
    assert TestSpec.__unions__() == %{
             event_content: [:user_added_event, :user_removed_event]
           }

    assert TestSpec.__objects__() == %{
             user: %{
               fields: [
                 {:name, :string, [null: false, optional: true]},
                 {:age, :integer, [null: false, optional: true]},
                 {:posts, {:list, :post}, [null: false, optional: true]}
               ]
             },
             post: %{
               fields: [
                 {:title, :string, [null: false, optional: true]},
                 {:content, :string, [optional: true, null: true]}
               ]
             },
             event: %{
               fields: [
                 {:inserted_at, :datetime, [null: false, optional: true]},
                 {:content, :event_content, [null: false, optional: true]}
               ]
             },
             user_added_event: %{
               fields: [
                 {:user_id, :integer, [null: false, optional: true]}
               ]
             },
             user_removed_event: %{
               fields: [
                 {:user_id, :integer, [null: false, optional: true]}
               ]
             }
           }
  end
end
