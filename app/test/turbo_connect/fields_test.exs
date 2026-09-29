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

  test "input fields accept a boolean skip_link_enrichment option" do
    assert :ok == TurboConnect.Fields.validate_field_opts(:inputs, skip_link_enrichment: true)
    assert :ok == TurboConnect.Fields.validate_field_opts(:inputs, skip_link_enrichment: false)
    assert Keyword.get(TurboConnect.Fields.default_field_opts(), :skip_link_enrichment, false) == false
  end

  test "skip_link_enrichment rejects non-boolean values" do
    for value <- [nil, "true", 1] do
      assert_raise ArgumentError, "skip_link_enrichment must be a boolean", fn ->
        TurboConnect.Fields.validate_field_opts(:inputs, skip_link_enrichment: value)
      end
    end
  end

  test "skip_link_enrichment is only allowed on inputs" do
    for scope <- [:outputs, :user] do
      assert_raise RuntimeError, ~r/Invalid options for field/, fn ->
        TurboConnect.Fields.validate_field_opts(scope, skip_link_enrichment: true)
      end
    end
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
