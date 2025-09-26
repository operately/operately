import { Subscriber } from "@/models/notifications";
import { sortSubscribersByName } from "./utils";

describe("sortSubscribersByName", () => {
  const testSubscribers: Subscriber[] = [
    {
      person: { id: "3", fullName: "Zoe Wilson" },
      isSubscribed: false,
      role: "Member",
      priority: false,
    },
    {
      person: { id: "1", fullName: "Alice Johnson" },
      isSubscribed: true,
      role: "Admin", 
      priority: true,
    },
    {
      person: { id: "2", fullName: "Bob Smith" },
      isSubscribed: false,
      role: "Contributor",
      priority: false,
    },
    {
      person: { id: "4", fullName: "Anna Davis" },
      isSubscribed: true,
      role: "Member",
      priority: false,
    },
  ];

  it("sorts subscribers by person full name alphabetically", () => {
    const sorted = sortSubscribersByName(testSubscribers);
    
    expect(sorted.map(s => s.person?.fullName)).toEqual([
      "Alice Johnson",
      "Anna Davis", 
      "Bob Smith",
      "Zoe Wilson"
    ]);
  });

  it("preserves original array", () => {
    const original = [...testSubscribers];
    sortSubscribersByName(testSubscribers);
    
    expect(testSubscribers).toEqual(original);
  });

  it("handles empty names gracefully", () => {
    const subscribersWithEmptyNames: Subscriber[] = [
      {
        person: { id: "1", fullName: "Bob Smith" },
        isSubscribed: false,
        role: "Member",
        priority: false,
      },
      {
        person: { id: "2", fullName: "" },
        isSubscribed: false,
        role: "Member", 
        priority: false,
      },
      {
        person: { id: "3", fullName: "Alice Johnson" },
        isSubscribed: false,
        role: "Member",
        priority: false,
      },
    ];

    const sorted = sortSubscribersByName(subscribersWithEmptyNames);
    
    // Empty strings come first in alphabetical order
    expect(sorted.map(s => s.person?.fullName)).toEqual([
      "",
      "Alice Johnson",
      "Bob Smith"
    ]);
  });

  it("handles undefined person objects", () => {
    const subscribersWithUndefinedPerson: Subscriber[] = [
      {
        person: { id: "1", fullName: "Bob Smith" },
        isSubscribed: false,
        role: "Member",
        priority: false,
      },
      {
        person: undefined,
        isSubscribed: false,
        role: "Member",
        priority: false,
      } as any,
      {
        person: { id: "3", fullName: "Alice Johnson" },
        isSubscribed: false,
        role: "Member",
        priority: false,
      },
    ];

    const sorted = sortSubscribersByName(subscribersWithUndefinedPerson);
    
    // Undefined person should be treated as empty string and come first
    expect(sorted.map(s => s.person?.fullName || "")).toEqual([
      "",
      "Alice Johnson", 
      "Bob Smith"
    ]);
  });

  it("handles empty array", () => {
    const sorted = sortSubscribersByName([]);
    expect(sorted).toEqual([]);
  });

  it("handles single subscriber", () => {
    const singleSubscriber = [testSubscribers[0]];
    const sorted = sortSubscribersByName(singleSubscriber);
    expect(sorted).toEqual(singleSubscriber);
  });
});