Feature: Groups

  Scenario: List all groups
    Given I am logged in as a user
    Given that a group with the name "Marketing" exists
    When I visit the groups page
    Then I should see "Marketing" in the list of groups

  Scenario: Create a new group
    Given I am logged in as a user
    When I create a new group with the name "Marketing"
    Then the new group "Marketing" is listing on the groups page

  Scenario: Changing the name of a group
    Given I am logged in as a user
    Given that a group with the name "Marketing" exists
    When I edit the group "Marketing" and change the name to "Sales"
    Then the group "Marketing" is no longer visible on the groups page
    And the group "Sales" is visible on the groups page
