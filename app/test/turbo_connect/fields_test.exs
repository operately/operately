defmodule TurboConnect.FieldsTest do
  use ExUnit.Case

  defmodule Example do
    use TurboConnect.Fields

    @field_scope :user
    field? :name, :string
    field? :age, :integer
    field? :hobbies, list_of(:string)

    @field_scope :post
    field? :title, :string
    field? :content, :string
  end

  test "defining fields" do
    assert Example.__fields__() == %{
             user: %{
               fields: [
                 {:name, :string, [optional: true]},
                 {:age, :integer, [optional: true]},
                 {:hobbies, {:list, :string}, [optional: true]}
               ]
             },
             post: %{
               fields: [
                 {:title, :string, [optional: true]},
                 {:content, :string, [optional: true]}
               ]
             }
           }
  end
end
