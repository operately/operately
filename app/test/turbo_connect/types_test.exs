defmodule TurboConnect.TypesTest do
  use ExUnit.Case

  defmodule SampleUser do
    defstruct [:name]
  end

  defmodule Post do
    defstruct [:title]
  end

  defmodule Alien do
    def __api_typename__, do: "creature"
    defstruct [:name]
  end

  defmodule TestSpec do
    use TurboConnect.Types

    # Explicit name when it differs from the module-derived default
    object :user, for: TurboConnect.TypesTest.SampleUser do
      field? :name, :string
      field? :age, :integer
      field? :posts, list_of(:post)
    end

    # Name omitted — derived as :post from Post
    object for: TurboConnect.TypesTest.Post do
      field? :title, :string
      field? :content, :string, null: true
    end

    object :monster, for: TurboConnect.TypesTest.Alien do
      field? :name, :string
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
               typename: "sample_user",
               fields: [
                 {:__typename, :string, [optional: false, null: false]},
                 {:name, :string, [null: false, optional: true]},
                 {:age, :integer, [null: false, optional: true]},
                 {:posts, {:list, :post}, [null: false, optional: true]}
               ]
             },
             post: %{
               typename: "post",
               fields: [
                 {:__typename, :string, [optional: false, null: false]},
                 {:title, :string, [null: false, optional: true]},
                 {:content, :string, [optional: true, null: true]}
               ]
             },
             monster: %{
               typename: "creature",
               fields: [
                 {:__typename, :string, [optional: false, null: false]},
                 {:name, :string, [null: false, optional: true]}
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

  test "object for: registers module to resolved typename" do
    assert TestSpec.__object_modules__() == %{
             TurboConnect.TypesTest.SampleUser => "sample_user",
             TurboConnect.TypesTest.Post => "post",
             TurboConnect.TypesTest.Alien => "creature"
           }
  end

  test "default_name_for_module derives object names" do
    assert TurboConnect.Types.default_name_for_module(Operately.Projects.Project) == "project"

    assert TurboConnect.Types.default_name_for_module(Operately.Activities.Content.MilestoneDeleting) ==
             "activity_content_milestone_deleting"
  end
end
