defmodule TurboConnect.FieldsTest do
  use ExUnit.Case

  defmodule Example do
    use TurboConnect.Fields

    @field_scope :inputs
    field? :send_notifications_to_everyone, :boolean, default: false, external_default: true

    @field_scope :user
    field? :name, :string
    field? :age, :integer
    field? :hobbies, list_of(:string)

    @field_scope :post
    field? :title, :string
    field? :content, :string, null: true
  end

  test "defining fields" do
    assert Example.__fields__() == %{
             inputs: %{
               fields: [
                 {:send_notifications_to_everyone, :boolean, [null: false, optional: true, default: false, external_default: true]}
               ]
             },
             user: %{
               fields: [
                 {:name, :string, [null: false, optional: true]},
                 {:age, :integer, [null: false, optional: true]},
                 {:hobbies, {:list, :string}, [null: false, optional: true]}
               ]
             },
             post: %{
               fields: [
                 {:title, :string, [null: false, optional: true]},
                 {:content, :string, [optional: true, null: true]}
               ]
             }
           }
  end
end
