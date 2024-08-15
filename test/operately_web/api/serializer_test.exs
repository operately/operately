defmodule OperatelyWeb.Api.SerializerTest do
  use Operately.DataCase
  alias OperatelyWeb.Api.Serializer

  describe "date and time serialization" do
    test "it serializes naive date time as UTC" do
      {:ok, naive_datetime} = NaiveDateTime.new(2020, 1, 1, 12, 0, 0)

      assert Serializer.serialize(naive_datetime) == "2020-01-01T12:00:00Z"
    end

    test "it serializes DateTime with the timezone" do
      {:ok, datetime} = DateTime.new(~D[2020-01-01], ~T[12:00:00], "Etc/UTC")

      assert Serializer.serialize(datetime) == "2020-01-01T12:00:00Z"
    end
  end
end
